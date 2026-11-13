import { useState } from "react";
import { StarRanking } from "../StarRanking";
const criteria = [
  { name: "correctness", title: "Correctness" },
  { name: "clarity", title: "Clarity" },
  { name: "tests", title: "Tests" },
];
export const Demo = () => {
  const [scores, setScores] = useState<Record<string, number>>({
    correctness: 4,
    clarity: 3,
    tests: 2,
  });
  return (
    <div>
      <p>
        Choose stars for each criterion. Clicking its current score clears it.
      </p>
      <StarRanking
        criteria={criteria}
        scores={scores}
        handleChange={(data) => {
          if (data)
            setScores((current) => ({
              ...current,
              [data.criterion.name]: data.value,
            }));
        }}
      />
      <h3>Read-only, three-star scale</h3>
      <StarRanking
        criteria={[{ name: "quality", title: "Quality" }]}
        scores={{ quality: 2 }}
        max={3}
        readOnly
      />
    </div>
  );
};
