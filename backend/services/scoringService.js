const calculateRiskScore = (findings) => {
  if (!findings || findings.length === 0) return 0;

  const counts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Info: 0
  };

  findings.forEach((finding) => {
    if (counts[finding.severity] !== undefined) {
      counts[finding.severity]++;
    }
  });

  //cap findings to exact limits
  const lowScore = Math.min(counts.Low * 5, 20);
  const mediumScore = Math.min(counts.Medium * 10, 40);
  const highScore = Math.min(counts.High * 20, 60);
  const criticalScore = Math.min(counts.Critical * 30, 100);

  // adding all and enforce a maximum cap of 100
  const finalScore = Math.min(100, lowScore + mediumScore + highScore + criticalScore);

  return finalScore;
};

module.exports = calculateRiskScore;