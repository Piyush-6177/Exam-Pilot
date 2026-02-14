export function useMarkdownExport() {
  const exportToMarkdown = (analysis, filename = 'exam-priority-list.md') => {
    if (!analysis || !analysis.topics) {
      alert('No data to export');
      return;
    }

    let markdown = '# NITP Exam Priority List\n\n';
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

    // Summary
    if (analysis.summary) {
      markdown += '## Summary\n\n';
      markdown += `- **Total Topics:** ${analysis.summary.totalTopics}\n`;
      markdown += `- **High Priority Topics:** ${analysis.summary.highPriorityCount}\n`;
      markdown += `- **Low Effort, High Reward Topics:** ${analysis.summary.lowEffortHighReward}\n\n`;
    }

    // Topics
    markdown += '## Priority List\n\n';
    
    // Sort by confidence
    const sortedTopics = [...analysis.topics].sort((a, b) => b.confidence - a.confidence);
    
    sortedTopics.forEach((topic, index) => {
      markdown += `### ${index + 1}. ${topic.name}\n\n`;
      markdown += `- **Confidence Score:** ${topic.confidence}%\n`;
      markdown += `- **Effort Level:** ${topic.effort}\n`;
      markdown += `- **Reward Level:** ${topic.reward}\n`;
      markdown += `- **Frequency:** ${topic.frequency} times\n`;
      if (topic.priority) {
        markdown += `- **Priority:** ${topic.priority}\n`;
      }
      if (topic.keyConcepts && topic.keyConcepts.length > 0) {
        markdown += `- **Key Concepts:** ${topic.keyConcepts.join(', ')}\n`;
      }
      if (topic.effort === 'Low' && topic.reward === 'High') {
        markdown += `- ⭐ **Low Effort, High Reward Topic**\n`;
      }
      markdown += '\n';
    });

    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { exportToMarkdown };
}
