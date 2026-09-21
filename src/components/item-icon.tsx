import type { ReactNode } from "react";
import type { EquipmentKind } from "@/types/stage";

interface EquipmentArtProps {
  kind: EquipmentKind;
  className?: string;
}

const SvgFrame = ({
  viewBox,
  className,
  children,
}: {
  viewBox: string;
  className?: string;
  children: ReactNode;
}) => (
  <svg
    viewBox={viewBox}
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    {children}
  </svg>
);

const art: Record<EquipmentKind, ReactNode> = {
  vocalist: (
    <SvgFrame viewBox="0 0 90 120">
      <ellipse cx="45" cy="112" rx="18" ry="5" fill="#000" opacity="0.12" />
      <circle cx="45" cy="22" r="12" fill="#1f2937" />
      <path d="M28 112c2-28 8-46 17-46s15 18 17 46" fill="#111827" />
      <path d="M39 66h12v28H39z" fill="#0f766e" />
      <path d="M58 48c10 2 16 10 18 20" stroke="#111827" strokeWidth="3" fill="none" />
      <rect x="72" y="66" width="6" height="18" rx="3" fill="#111827" />
      <circle cx="75" cy="64" r="5" fill="#e5e7eb" stroke="#111827" strokeWidth="2" />
    </SvgFrame>
  ),
  guitar: (
    <SvgFrame viewBox="0 0 80 180">
      <ellipse cx="40" cy="174" rx="16" ry="4" fill="#000" opacity="0.12" />
      <path d="M30 10h20l-3 14H33z" fill="#1c1917" />
      <rect x="37" y="22" width="6" height="62" rx="1" fill="#d6c09a" />
      <path
        d="M40 82c-11 2-20 8-24 18-5 12-2 28 10 34 6 4 10 4 14 3 3 10 8 16 16 16 12 0 20-10 22-24 2-16-6-30-18-36-4-8-12-12-20-11z"
        fill="#b45309"
        stroke="#7c2d12"
        strokeWidth="2"
      />
      <circle cx="42" cy="118" r="8" fill="#1c1917" />
      <rect x="36" y="82" width="8" height="14" fill="#e7e5e4" />
    </SvgFrame>
  ),
  bass: (
    <SvgFrame viewBox="0 0 82 188">
      <ellipse cx="41" cy="182" rx="16" ry="4" fill="#000" opacity="0.12" />
      <path d="M29 8h24l-4 16H33z" fill="#1c1917" />
      <rect x="38" y="22" width="6" height="66" rx="1" fill="#a8a29e" />
      <path
        d="M41 86c-14 4-24 14-26 28-2 16 6 30 20 34 5 12 12 18 20 16 14-4 22-18 22-34 0-16-10-30-24-36-4-6-8-8-12-8z"
        fill="#1e3a5f"
        stroke="#0f172a"
        strokeWidth="2"
      />
      <rect x="36" y="124" width="12" height="14" rx="1" fill="#d6d3d1" />
    </SvgFrame>
  ),
  keyboard: (
    <SvgFrame viewBox="0 0 200 80">
      <ellipse cx="100" cy="74" rx="70" ry="5" fill="#000" opacity="0.12" />
      <rect x="8" y="28" width="184" height="36" rx="3" fill="#111827" />
      <rect x="14" y="34" width="172" height="24" fill="#f8fafc" />
      {Array.from({ length: 14 }, (_, index) => (
        <rect
          key={index}
          x={18 + index * 12}
          y="34"
          width="10"
          height="24"
          fill="#f8fafc"
          stroke="#cbd5e1"
        />
      ))}
      {Array.from({ length: 10 }, (_, index) => (
        <rect key={`b-${index}`} x={24 + index * 16} y="34" width="6" height="14" fill="#111827" />
      ))}
      <rect x="8" y="22" width="184" height="8" rx="2" fill="#0f172a" />
    </SvgFrame>
  ),
  drums: (
    <SvgFrame viewBox="0 0 320 280">
      <ellipse cx="160" cy="268" rx="90" ry="8" fill="#000" opacity="0.1" />
      <ellipse cx="160" cy="168" rx="58" ry="50" fill="#9a3412" stroke="#1c1917" strokeWidth="4" />
      <ellipse cx="160" cy="168" rx="38" ry="32" fill="#e7e5e4" />
      <ellipse cx="118" cy="128" rx="28" ry="22" fill="#c2410c" stroke="#1c1917" strokeWidth="3" />
      <ellipse cx="118" cy="128" rx="18" ry="14" fill="#f5f5f4" />
      <ellipse cx="198" cy="122" rx="26" ry="20" fill="#c2410c" stroke="#1c1917" strokeWidth="3" />
      <ellipse cx="198" cy="122" rx="16" ry="12" fill="#f5f5f4" />
      <ellipse cx="96" cy="196" rx="24" ry="20" fill="#d6d3d1" stroke="#1c1917" strokeWidth="3" />
      <ellipse cx="232" cy="198" rx="32" ry="26" fill="#c2410c" stroke="#1c1917" strokeWidth="3" />
      <ellipse cx="232" cy="198" rx="20" ry="16" fill="#f5f5f4" />
      <ellipse cx="64" cy="148" rx="28" ry="8" fill="#d6d3d1" stroke="#44403c" strokeWidth="2" />
      <ellipse cx="64" cy="142" rx="28" ry="8" fill="#a8a29e" stroke="#44403c" strokeWidth="2" />
      <ellipse cx="250" cy="108" rx="36" ry="10" fill="#d6d3d1" stroke="#44403c" strokeWidth="2" />
      <ellipse cx="86" cy="88" rx="32" ry="9" fill="#d6d3d1" stroke="#44403c" strokeWidth="2" />
      <circle cx="160" cy="74" r="11" fill="#44403c" />
      <path d="M64 148 96 168M250 108 210 130M86 88 118 118M160 85v28" stroke="#1c1917" strokeWidth="3" />
    </SvgFrame>
  ),
  percussion: (
    <SvgFrame viewBox="0 0 160 150">
      <ellipse cx="52" cy="142" rx="28" ry="5" fill="#000" opacity="0.12" />
      <ellipse cx="110" cy="142" rx="24" ry="5" fill="#000" opacity="0.12" />
      <ellipse cx="52" cy="40" rx="30" ry="12" fill="#b45309" />
      <path d="M22 40c0 48 8 90 30 90s30-42 30-90" fill="#c2410c" />
      <ellipse cx="52" cy="40" rx="24" ry="9" fill="#fde68a" />
      <ellipse cx="110" cy="48" rx="24" ry="10" fill="#b45309" />
      <path d="M86 48c0 40 6 78 24 78s24-38 24-78" fill="#9a3412" />
      <ellipse cx="110" cy="48" rx="18" ry="7" fill="#fde68a" />
    </SvgFrame>
  ),
  chair: (
    <SvgFrame viewBox="0 0 90 90">
      <rect x="18" y="28" width="54" height="8" rx="2" fill="#57534e" />
      <rect x="22" y="36" width="46" height="28" rx="2" fill="#78716c" />
      <rect x="22" y="64" width="6" height="18" fill="#44403c" />
      <rect x="62" y="64" width="6" height="18" fill="#44403c" />
      <rect x="22" y="12" width="46" height="16" rx="2" fill="#57534e" />
    </SvgFrame>
  ),
  riser: (
    <SvgFrame viewBox="0 0 160 120">
      <rect
        x="6"
        y="8"
        width="148"
        height="104"
        rx="4"
        fill="#cbd5e1"
        fillOpacity="0.35"
        stroke="#64748b"
        strokeWidth="3"
        strokeDasharray="8 5"
      />
      <path d="M18 96h124" stroke="#94a3b8" strokeWidth="2" />
    </SvgFrame>
  ),
  wedge: (
    <SvgFrame viewBox="0 0 140 90">
      <ellipse cx="70" cy="84" rx="40" ry="5" fill="#000" opacity="0.12" />
      <path d="M18 78 70 12l52 66H18z" fill="#1f2937" />
      <path d="M32 72 70 24l38 48H32z" fill="#334155" />
      <path d="M44 66 70 34l26 32H44z" fill="#0f172a" />
      {Array.from({ length: 5 }, (_, index) => (
        <path
          key={index}
          d={`M${48 + index * 5} 62 L70 ${38 + index * 3} L${92 - index * 5} 62`}
          stroke="#64748b"
          strokeWidth="1"
          fill="none"
        />
      ))}
    </SvgFrame>
  ),
  iem: (
    <SvgFrame viewBox="0 0 80 80">
      <rect x="22" y="18" width="36" height="46" rx="6" fill="#111827" />
      <circle cx="40" cy="36" r="8" fill="#0f766e" />
      <rect x="28" y="50" width="24" height="6" rx="1" fill="#6ee7b7" />
      <path d="M28 18c0-10 24-10 24 0" stroke="#111827" strokeWidth="4" fill="none" />
    </SvgFrame>
  ),
  "guitar-amp": (
    <SvgFrame viewBox="0 0 120 100">
      <ellipse cx="60" cy="94" rx="38" ry="5" fill="#000" opacity="0.12" />
      <rect x="12" y="10" width="96" height="78" rx="4" fill="#44403c" />
      <rect x="18" y="16" width="84" height="66" rx="2" fill="#1c1917" />
      <circle cx="60" cy="49" r="24" fill="#292524" stroke="#78716c" strokeWidth="3" />
      <circle cx="60" cy="49" r="10" fill="#57534e" />
      <circle cx="32" cy="24" r="3" fill="#a8a29e" />
      <circle cx="88" cy="24" r="3" fill="#a8a29e" />
    </SvgFrame>
  ),
  "bass-amp": (
    <SvgFrame viewBox="0 0 140 116">
      <ellipse cx="70" cy="110" rx="46" ry="5" fill="#000" opacity="0.12" />
      <rect x="10" y="8" width="120" height="96" rx="4" fill="#292524" />
      <rect x="16" y="14" width="108" height="84" rx="2" fill="#1c1917" />
      <circle cx="48" cy="56" r="22" fill="#292524" stroke="#78716c" strokeWidth="3" />
      <circle cx="92" cy="56" r="22" fill="#292524" stroke="#78716c" strokeWidth="3" />
      <circle cx="48" cy="56" r="8" fill="#57534e" />
      <circle cx="92" cy="56" r="8" fill="#57534e" />
    </SvgFrame>
  ),
  "mic-stand": (
    <SvgFrame viewBox="0 0 70 160">
      <ellipse cx="35" cy="154" rx="22" ry="5" fill="#000" opacity="0.12" />
      <path d="M14 154h42" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 154V42" stroke="#1f2937" strokeWidth="4" />
      <path d="M35 48c16 6 24 18 26 34" stroke="#1f2937" strokeWidth="3" fill="none" />
      <rect x="54" y="78" width="7" height="22" rx="3" fill="#111827" />
      <circle cx="57.5" cy="76" r="7" fill="#e5e7eb" stroke="#111827" strokeWidth="2" />
    </SvgFrame>
  ),
  "di-box": (
    <SvgFrame viewBox="0 0 90 58">
      <rect x="8" y="10" width="74" height="38" rx="3" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2" />
      <circle cx="28" cy="29" r="7" fill="#111827" stroke="#93c5fd" strokeWidth="2" />
      <circle cx="62" cy="29" r="7" fill="#111827" stroke="#93c5fd" strokeWidth="2" />
      <text x="45" y="48" textAnchor="middle" fill="#dbeafe" fontSize="8" fontWeight="700">
        DI
      </text>
    </SvgFrame>
  ),
  power: (
    <SvgFrame viewBox="0 0 70 70">
      <rect x="10" y="10" width="50" height="50" rx="6" fill="#facc15" stroke="#854d0e" strokeWidth="3" />
      <circle cx="28" cy="32" r="5" fill="#854d0e" />
      <circle cx="42" cy="32" r="5" fill="#854d0e" />
      <rect x="24" y="44" width="22" height="6" rx="1" fill="#854d0e" />
    </SvgFrame>
  ),
  speaker: (
    <SvgFrame viewBox="0 0 90 130">
      <rect x="16" y="6" width="58" height="118" rx="4" fill="#111827" />
      <circle cx="45" cy="36" r="16" fill="#1f2937" stroke="#6b7280" strokeWidth="3" />
      <circle cx="45" cy="88" r="22" fill="#1f2937" stroke="#6b7280" strokeWidth="3" />
      <circle cx="45" cy="36" r="6" fill="#9ca3af" />
      <circle cx="45" cy="88" r="8" fill="#9ca3af" />
    </SvgFrame>
  ),
  snake: (
    <SvgFrame viewBox="0 0 130 80">
      <rect x="8" y="16" width="114" height="48" rx="4" fill="#1e40af" stroke="#0f172a" strokeWidth="2" />
      {Array.from({ length: 6 }, (_, index) => (
        <circle key={index} cx={24 + index * 16} cy="40" r="5" fill="#0f172a" stroke="#93c5fd" />
      ))}
    </SvgFrame>
  ),
  other: (
    <SvgFrame viewBox="0 0 100 100">
      <rect x="14" y="22" width="72" height="56" rx="3" fill="#78716c" stroke="#44403c" strokeWidth="3" />
      <path d="M14 38h72" stroke="#44403c" strokeWidth="3" />
      <rect x="40" y="48" width="20" height="10" rx="1" fill="#a8a29e" />
    </SvgFrame>
  ),
};

export const EquipmentArt = ({ kind, className = "h-full w-full" }: EquipmentArtProps) =>
  art[kind] ? (
    <span className={`inline-grid place-items-center [&>svg]:h-full [&>svg]:w-full ${className}`}>
      {art[kind]}
    </span>
  ) : null;

export const ItemIcon = ({ kind, className }: EquipmentArtProps) => (
  <EquipmentArt kind={kind} className={className} />
);
