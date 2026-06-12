export const calculateTotalScore = (items: { score: number | null }[]): number => {
  return items.reduce((total, item) => {
    return total + (item.score || 0);
  }, 0);
};

export const calculateMaxScore = (items: { max_score: number }[]): number => {
  return items.reduce((total, item) => {
    return total + item.max_score;
  }, 0);
};

export const calculateFinalScore = (totalScore: number, maxScore: number): number => {
  if (maxScore === 0) return 0;
  const finalScore = (totalScore / maxScore) * 100;
  return Number(finalScore.toFixed(2));
};

export const getItemStatus = (score: number | null, maxScore: number): string | null => {
  if (score === null || score === undefined) return null;
  if (score === maxScore) return 'Optimal';
  
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'Baik';
  if (percentage >= 60) return 'Cukup';
  return 'Perlu Pembinaan';
};

export const getScoreStatus = (finalScore: number, scoreRanges: any[]): string => {
  // Assuming scoreRanges are sorted or we just find the matching range
  const range = scoreRanges.find(
    r => finalScore >= Number(r.min_score) && finalScore <= Number(r.max_score)
  );
  
  return range ? range.status : 'Tidak Diketahui';
};

export const calculateCategoryScores = (items: { item_category: string, score: number | null, max_score: number }[]) => {
  const categories: Record<string, { totalScore: number, maxScore: number }> = {};
  
  items.forEach(item => {
    if (!categories[item.item_category]) {
      categories[item.item_category] = { totalScore: 0, maxScore: 0 };
    }
    categories[item.item_category].totalScore += (item.score || 0);
    categories[item.item_category].maxScore += item.max_score;
  });

  return Object.keys(categories).map(category => {
    const finalScore = calculateFinalScore(categories[category].totalScore, categories[category].maxScore);
    return {
      category,
      total_score: categories[category].totalScore,
      max_score: categories[category].maxScore,
      final_score: finalScore,
      status: finalScore >= 80 ? 'Baik' : (finalScore >= 60 ? 'Cukup' : 'Kurang')
    };
  });
};
