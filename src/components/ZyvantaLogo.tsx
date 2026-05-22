interface Props {
  className?: string;
}

export const ZyvantaLogo = ({ className = "" }: Props) => (
  <span className={`font-display font-black tracking-[0.15em] neon-text ${className}`}>
    ZYVANTA
  </span>
);
