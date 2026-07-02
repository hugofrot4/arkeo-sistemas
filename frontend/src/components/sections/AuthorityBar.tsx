import { Fragment, useEffect, useState } from "react";
import { getMetrics, type Metric } from "../../lib/api";
import Reveal from "../ui/Reveal";

const defaultMetrics: Metric[] = [
  { id: 1, number: "+20", label: "Projetos entregues", order: 0 },
  { id: 2, number: "6", label: "Anos de experiência", order: 1 },
  { id: 3, number: "100%", label: "Remoto e ágil", order: 2 },
  { id: 4, number: "✦", label: "Suporte contínuo", order: 3 },
];

function AuthorityBar() {
  const [metrics, setMetrics] = useState<Metric[]>(defaultMetrics);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(defaultMetrics));
  }, []);

  return (
    <div className="border-border border-t border-b py-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-16 px-6">
        {metrics.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 && (
              <div className="bg-border hidden h-10 w-px sm:block" />
            )}
            <Reveal delay={`${index * 0.1}s`} className="text-center">
              <div className="font-family-display text-[2rem] leading-none font-bold text-white">
                {item.number}
              </div>
              <div className="text-text-muted mt-1 text-[0.78rem]">
                {item.label}
              </div>
            </Reveal>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default AuthorityBar;
