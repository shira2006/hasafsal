import logo from "../assets/logo.svg";

interface Props {
  view: "map" | "about";
}

/** סרגל עליון: לוגו (ספסל בעיפרון עם המילה "הספסל") וקישור ל"המשימה שלנו". הניווט הוא לפי hash. */
export default function Navbar({ view }: Props) {
  return (
    <header className="navbar">
      <a href="#/" aria-label="הספסל, למפה"><img className="logo" src={logo} alt="הספסל" /></a>
      <span className="spacer" />
      {view === "about"
        ? <a className="pill" href="#/">חזרה למפה</a>
        : <a className="pill" href="#/about">המשימה שלנו</a>}
    </header>
  );
}
