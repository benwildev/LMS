const P: Record<string, string> = {
  overview: "M3 13h4v6H3zM10 8h4v11h-4zM17 4h4v15h-4z",
  payments: "M3 6h18v12H3zM3 10h18M7 15h4",
  courses: "M4 5h10v14H4zM14 8l6-2v14l-6 2",
  students: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.3 3.3 0 0 1 0 6.4M18 14.6c1.8.8 3 2.6 3.5 5.4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1.2-2-3.5-2.2.7-1.7-1L14.6 4h-5.2l-.5 3-1.7 1-2.2-.7-2 3.5L5 12l-2 1.2 2 3.5 2.2-.7 1.7 1 .5 3h5.2l.5-3 1.7-1 2.2.7 2-3.5z",
  site: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  learn: "M4 5h16v11H4zM9 20h6M10 8.5v4l3.5-2z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6 6 18",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  check: "M5 12.5l4.5 4.5L19 7.5",
  back: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  plus: "M12 5v14M5 12h14",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  wallet: "M3 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 13h1",
  arrow: "M7 17 17 7M9 7h8v8",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  chevron: "M6 9l6 6 6-6",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6",
};

export default function Icon({ name, size = 16 }: { name: keyof typeof P | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? ""} />
    </svg>
  );
}
