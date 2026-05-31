import type { SVGProps } from "react";

type BenefitIconProps = SVGProps<SVGSVGElement>;

export function BenefitAntiSpyIcon(props: BenefitIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <path d="M24 6 38 12v12c0 9-6 16-14 18-8-2-14-9-14-18V12L24 6Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M24 28v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BenefitStructureIcon(props: BenefitIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <circle cx="24" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="36" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M24 14v8M24 22 12 30M24 22l12 8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function BenefitMultiAccountIcon(props: BenefitIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <circle cx="18" cy="18" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="30" cy="18" r="8" stroke="currentColor" strokeWidth="2" opacity="0.75" />
      <circle cx="24" cy="30" r="8" stroke="currentColor" strokeWidth="2" opacity="0.55" />
    </svg>
  );
}

export function BenefitTimeIcon(props: BenefitIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" />
      <path d="M24 14v12l8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 8 40 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BenefitZeroReworkIcon(props: BenefitIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <path d="M12 24 20 32 36 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 34 18 42 34 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}

export function BenefitScaleIcon(props: BenefitIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <path d="M10 34h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 34V22l8-8 8 6 8-10v16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 10l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const benefitIcons = [
  BenefitAntiSpyIcon,
  BenefitStructureIcon,
  BenefitMultiAccountIcon,
  BenefitTimeIcon,
  BenefitZeroReworkIcon,
  BenefitScaleIcon,
] as const;
