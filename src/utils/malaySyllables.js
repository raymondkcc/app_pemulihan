export function splitMalaySyllables(word) {
  const lower = word.toLowerCase();
  const digraphs = ["ng", "ny", "sy", "kh"];
  const clusters = ["st", "tr", "pl", "kr", "br", "sk", "kl", "dr", "pr", "gr", "bl", "fl", "fr"];

  const result = [];
  let index = 0;

  while (index < lower.length) {
    let syllable = "";

    while (index < lower.length && !/[aeiou]/.test(lower[index])) {
      if (syllable.length === 0 && index + 1 < lower.length) {
        const pair = lower.substring(index, index + 2);
        if (clusters.includes(pair)) {
          syllable += word.substring(index, index + 2);
          index += 2;
          continue;
        }
      }
      syllable += word[index];
      index += 1;
    }

    while (index < lower.length && /[aeiou]/.test(lower[index])) {
      syllable += word[index];
      index += 1;
    }

    if (index < lower.length) {
      if (index + 1 < lower.length) {
        const pair = lower.substring(index, index + 2);
        if (digraphs.includes(pair)) {
          if (!(index + 2 < lower.length && /[aeiou]/.test(lower[index + 2]))) {
            syllable += word.substring(index, index + 2);
            index += 2;
          }
        } else if (!/[aeiou]/.test(lower[index + 1])) {
          syllable += word[index];
          index += 1;
        }
      } else {
        syllable += word[index];
        index += 1;
      }
    }

    if (syllable) result.push(syllable);
  }

  return result.length > 0 ? result : [word];
}
