import { onCLS, onINP, onLCP } from "web-vitals";

function publish(metric: {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: string;
  navigationType: string;
}): void {
  const detail = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType
  };
  window.dispatchEvent(new CustomEvent("pds-web-vital", { detail }));
}

onCLS(publish);
onINP(publish, { reportAllChanges: true });
onLCP(publish);
