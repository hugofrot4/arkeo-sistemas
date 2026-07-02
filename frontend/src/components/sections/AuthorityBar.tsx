import { Fragment } from "react";
import Reveal from "../ui/Reveal";

const authorityItems = [
  {
    number: (
      <>
        <em className="text-accent not-italic">+</em>20
      </>
    ),
    label: "Projetos entregues",
    delay: "0s",
  },
  {
    number: "6",
    label: "Anos de experiência",
    delay: "0.1s",
  },
  {
    number: (
      <>
        <em className="text-accent not-italic">100</em>%
      </>
    ),
    label: "Remoto e ágil",
    delay: "0.2s",
  },
  {
    number: <em className="text-accent not-italic">✦</em>,
    label: "Suporte contínuo",
    delay: "0.3s",
  },
];

function AuthorityBar() {
  return (
    <div className="border-border border-t border-b py-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-16 px-6">
        {authorityItems.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <div className="bg-border hidden h-10 w-px sm:block" />
            )}
            <Reveal delay={item.delay} className="text-center">
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
