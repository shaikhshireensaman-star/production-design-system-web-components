import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@production-design-system/components";
import "@production-design-system/tokens/tokens.css";
import "./style.css";

function RatingExample() {
  const [score, setScore] = useState(4);

  return (
    <main>
      <p className="eyebrow">REACT 19 INTEGRATION</p>
      <h1>Use the custom element directly</h1>
      <p>The rating stays a native Web Component. React handles the custom event using its lowercase, dashed event name.</p>
      <pds-rating
        label="Rate this integration example"
        value={score}
        onpds-change={event => setScore(event.detail.value)}
      />
      <p aria-live="polite">Your rating: {score} of 5</p>
      <pre><code>{`<pds-rating
  label="Rate this example"
  value={score}
  onpds-change={event => setScore(event.detail.value)}
/>`}</code></pre>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<RatingExample />);
