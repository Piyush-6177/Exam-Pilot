import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractTextFromPdf } from '../utils/pdfTextExtractor';
import { validateDocumentContent } from '../utils/documentValidation';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function getGenAI() {
  if (!API_KEY || API_KEY.trim() === '') {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add your API key to the .env file.');
  }
  return new GoogleGenerativeAI(API_KEY);
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Convert File to base64 for Gemini API
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Process the API response and extract JSON
 */
function processResponse(response) {
  const text = response.text();

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const analysis = JSON.parse(jsonText.trim());
    // Layer 3: Handle AI-returned INVALID_DOCUMENT
    if (analysis && analysis.error === 'INVALID_DOCUMENT') {
      const err = new Error(analysis.reason || 'The file appears to be unrelated to academic coursework.');
      err.code = 'INVALID_DOCUMENT';
      err.detectedType = (analysis.reason || '').match(/detected:\s*([^)]+)/)?.[1]?.trim() || 'non-academic document';
      throw err;
    }
    return analysis;
  } catch (parseError) {
    // Rethrow our INVALID_DOCUMENT so UI can show friendly message
    if (parseError && parseError.code === 'INVALID_DOCUMENT') throw parseError;
    // If JSON parsing fails, try to extract JSON object from the text
    const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        const analysis = JSON.parse(jsonObjectMatch[0]);
        if (analysis && analysis.error === 'INVALID_DOCUMENT') {
          const err = new Error(analysis.reason || 'The file appears to be unrelated to academic coursework.');
          err.code = 'INVALID_DOCUMENT';
          err.detectedType = (analysis.reason || '').match(/detected:\s*([^)]+)/)?.[1]?.trim() || 'non-academic document';
          throw err;
        }
        return analysis;
      } catch (e) {
        if (e && e.code === 'INVALID_DOCUMENT') throw e;
        throw new Error('Failed to parse JSON response. The AI response may not be in the correct format.');
      }
    }
    throw parseError;
  }
}

/**
 * Generate content with retry logic
 */
async function generateContentWithRetry(model, content, maxRetries = 3, onProgress) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 2), 10000); // Exponential backoff, max 10s
        onProgress?.(`Retrying... (Attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
      }
      
      const result = await Promise.race([
        model.generateContent(content),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 120000) // 2 minute timeout
        )
      ]);
      
      return await result.response;
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || error.toString();
      
      // Don't retry on certain errors
      if (errorMessage.includes('timeout') || 
          errorMessage.includes('invalid') || 
          errorMessage.includes('quota') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')) {
        throw error;
      }
      
      // Retry on 503, 500, 429 (rate limit)
      if (errorMessage.includes('503') || 
          errorMessage.includes('500') || 
          errorMessage.includes('429') ||
          errorMessage.includes('high demand')) {
        if (attempt < maxRetries) {
          continue; // Retry
        }
      } else {
        throw error; // Don't retry on other errors
      }
    }
  }
  
  throw lastError;
}

/**
 * Analyze syllabus and past papers using Gemini with fallback
 */
export async function analyzeExamStrategy(syllabusFile, pyqFile, onProgress) {
  const startTime = Date.now();
  
  try {
    onProgress?.('Step 1: Extracting PDFs...');

    // Layer 2: Gatekeeper - validate document content before calling AI
    const [syllabusText, pyqText] = await Promise.all([
      extractTextFromPdf(syllabusFile, 4000).catch(() => ''),
      extractTextFromPdf(pyqFile, 4000).catch(() => ''),
    ]);
    const combinedText = (syllabusText + '\n' + pyqText).slice(0, 8000);
    const validation = validateDocumentContent(combinedText);
    if (!validation.passed) {
      throw Object.assign(
        new Error('Uploaded file does not appear to be a valid Syllabus or Question Paper.'),
        { code: 'INVALID_DOCUMENT', status: 400 }
      );
    }

    // Convert PDFs to base64 for Gemini
    const [syllabusData, pyqData] = await Promise.all([
      fileToBase64(syllabusFile),
      fileToBase64(pyqFile),
    ]);

    // Layer 3: Strict Persona system prompt (fail-safe)
    const prompt = `You are a strict Academic Quality Controller. Your ONLY job is to analyze University Syllabi and Past Exam Papers.

PHASE 1: VALIDATION
First, scan the provided documents for academic context. Look for course codes, unit breakdowns, university names, or question patterns.
- IF the text appears to be a receipt, ticket, invoice, or random non-academic text: STOP.
- Return this EXACT JSON error (nothing else): {"error": "INVALID_DOCUMENT", "reason": "The file appears to be unrelated to academic coursework (detected: [Insert what you found, e.g., Train Ticket])."}

PHASE 2: ANALYSIS
Only if Phase 1 passes (documents are clearly syllabus or exam papers), proceed:
Map syllabus topics to exam questions. Identify "Low Effort, High Reward" topics (short topics that appear frequently).

For each topic, provide:
- Topic name
- Confidence score (0-100)
- Effort level (Low/Medium/High)
- Reward level (Low/Medium/High)
- Frequency count
- Key concepts (2-3 max)

Output ONLY valid JSON (no error field):
{
  "topics": [
    {
      "name": "Topic Name",
      "confidence": 92,
      "effort": "Low",
      "reward": "High",
      "frequency": 5,
      "keyConcepts": ["concept1", "concept2"],
      "priority": "High"
    }
  ],
  "summary": {
    "totalTopics": 10,
    "highPriorityCount": 3,
    "lowEffortHighReward": 2
  }
}`;

    const content = [
      { text: prompt },
      syllabusData,
      pyqData,
    ];

    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    };

    // Try models in order: gemini-3-flash-preview -> gemini-1.5-flash -> gemini-1.5-pro
    const modelsToTry = [
      { name: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
      { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    ];

    let lastError;
    
    const genAI = getGenAI();
    
    for (const modelConfig of modelsToTry) {
      try {
        onProgress?.(`Step 2: Analyzing documents with ${modelConfig.label}...`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelConfig.name,
          generationConfig,
        });

        onProgress?.('Step 3: Generating Priority Matrix...');

        // Add a timeout indicator
        const progressInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (elapsed > 10) {
            onProgress?.(`Step 3: Generating Priority Matrix... (${elapsed}s)`);
          }
        }, 5000);

        try {
          const response = await generateContentWithRetry(model, content, 3, onProgress);
          clearInterval(progressInterval);
          
          const analysis = processResponse(response);
          
          const totalTime = Math.floor((Date.now() - startTime) / 1000);
          console.log(`Analysis completed in ${totalTime} seconds using ${modelConfig.name}`);
          
          return analysis;
        } catch (apiError) {
          clearInterval(progressInterval);
          
          const errorMessage = apiError.message || apiError.toString();
          
          // If it's a high demand error, try next model
          if (errorMessage.includes('503') || 
              errorMessage.includes('high demand') ||
              errorMessage.includes('currently experiencing')) {
            lastError = apiError;
            onProgress?.(`${modelConfig.label} is unavailable. Trying fallback model...`);
            await sleep(2000); // Brief delay before trying next model
            continue; // Try next model
          }
          
          throw apiError; // Other errors, don't try next model
        }
      } catch (modelError) {
        lastError = modelError;
        const errorMessage = modelError.message || modelError.toString();
        
        // If it's a high demand error, try next model
        if (errorMessage.includes('503') || 
            errorMessage.includes('high demand') ||
            errorMessage.includes('currently experiencing')) {
          onProgress?.(`${modelConfig.label} is unavailable. Trying fallback model...`);
          await sleep(2000);
          continue;
        }
        
        throw modelError;
      }
    }
    
    // If all models failed
    throw lastError || new Error('All models are currently unavailable. Please try again later.');
    
  } catch (error) {
    console.error('Error analyzing documents:', error);

    // Preserve INVALID_DOCUMENT for UI to show friendly card
    if (error && error.code === 'INVALID_DOCUMENT') {
      throw error;
    }

    const errorMessage = error.message || error.toString();

    // Provide more helpful error messages
    if (errorMessage.includes('timeout')) {
      throw new Error('Request timeout: Analysis is taking longer than expected. Please try again with smaller PDFs.');
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (errorMessage.includes('invalid') || errorMessage.includes('401') || errorMessage.includes('403')) {
      throw new Error('Invalid API key or request. Please check your configuration.');
    } else if (errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('currently experiencing')) {
      throw new Error('The AI model is currently experiencing high demand. Please wait a moment and try again. The app will automatically retry with fallback models.');
    } else if (errorMessage.includes('all models')) {
      throw new Error('All AI models are currently unavailable due to high demand. Please try again in a few minutes.');
    } else {
      throw new Error(`Failed to analyze documents: ${errorMessage}`);
    }
  }
}
