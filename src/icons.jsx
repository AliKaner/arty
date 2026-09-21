import React from "react";
// Atelier line studies: a small bespoke set, drawn on a 24-unit canvas.
// Open contours and slightly off-axis strokes echo pencil marks on paper.
const paths = {
  ArrowUpRight: "M5 19 19 5M9 4.5 19.5 4.5 19.5 15",
  ArrowRight: "M3 12.5 21 11.5M14 5l7 6.5-6.5 7",
  Search:
    "M16.8 15.8 22 21.5M18 10.4c.4 4.7-2.7 7.5-7.3 7.8-4.8.3-8-2.7-8-7.2S5.8 3.2 10.3 3c4.2-.2 7.3 2.9 7.7 7.4Z",
  SlidersHorizontal: "M3 6h10m5 0h3M3 17h4m5 0h9M14 2l1 8M8 13l1 8",
  X: "M5 4.5 19 19.5M19.5 5 4.5 19",
  Plus: "M3 12.5 21 11.5M12.5 3 11.5 21",
  ImagePlus: "M4 9V3.5L20 3v17.5L4 21v-6m3 0 4-5 6 7M1 11h6M4 8v6m10-8h.01",
  Pencil: "m5 16 12-13 4 4L8 20l-5 1 2-5Zm10-10 4 4M5 16l3 4",
  Trash2: "M3 6.5 21 6M7 6l.7 14.5 9.4-.5L18 6M9 3l6-.5M10 10l.5 7M14 10v7",
  Check: "m4 12 5 6L21 5",
  Maximize2: "M4 10V4h6M14 20h6v-6M5 5l5 5m4 4 5 5",
  Mail: "m3 5 18-1 .5 15.5L3 20V5Zm0 1 9 7 9-8",
  Phone: "M8 3 4 4c-4 8 9 20 16 15l1-4-6-2-2 3c-2-1-5-4-6-6l3-2-2-5Z",
  MapPin:
    "M12 22s8-8 8-13C20 0 4 0 4 9c0 5 8 13 8 13Zm3-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  Camera:
    "M3 7h4l2-4 6 .5L17 7h4l-.5 13L3 21V7Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  Folio: "M4 3 19 2l1 18-15 2L4 3Zm4 3 7-.5M8 10l8-1m-8 5 5-.5",
};
function makeIcon(name) {
  return function Icon({ size = 24, ...props }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        <path d={paths[name]} />
      </svg>
    );
  };
}
export const ArrowUpRight = makeIcon("ArrowUpRight"),
  ArrowRight = makeIcon("ArrowRight"),
  Search = makeIcon("Search"),
  SlidersHorizontal = makeIcon("SlidersHorizontal"),
  X = makeIcon("X"),
  Plus = makeIcon("Plus"),
  ImagePlus = makeIcon("ImagePlus"),
  Pencil = makeIcon("Pencil"),
  Trash2 = makeIcon("Trash2"),
  Check = makeIcon("Check"),
  Maximize2 = makeIcon("Maximize2"),
  Mail = makeIcon("Mail"),
  Phone = makeIcon("Phone"),
  MapPin = makeIcon("MapPin"),
  Camera = makeIcon("Camera"),
  Folio = makeIcon("Folio");
export function InkMark({ size = 40, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8 48C13 37 24 8 34 9c12 1-17 47-8 47 8 0 30-34 26-36-7-4-25 32-37 30M13 38c14 0 29-5 44-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function LoopStudy(props) {
  return (
    <svg viewBox="0 0 150 170" fill="none" aria-hidden="true" {...props}>
      <path
        d="M36 146C13 121 126 56 107 23 89-8 22 75 45 111c24 38 109-7 83-30C104 60 40 121 63 151M41 138c22-2 37-11 47-21"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
