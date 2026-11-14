import logo from "../assets/logo.svg";

interface Props {
  view: "map" | "about";
}

/** סרגל עליון: לוגו, תצוגת מפה, עוד על הספסל. העמוד הנוכחי מלא בצבע, לכולם מסגרת כהה. הניווט הוא לפי hash. */
export default function Navbar({ view }: Props) {
  return (
    <header className="navbar">
      <a className="logo-link" href="#/" aria-label="הספסל, למפה"><img className="logo" src={logo} alt="הספסל" /></a>
      <span className="spacer" />
      <nav className="tabs" aria-label="ניווט ראשי">
        <a href="#/" aria-current={view === "map" ? "page" : undefined}>תצוגת מפה</a>
        <a href="#/about" aria-current={view === "about" ? "page" : undefined}>עוד על הספסל</a>
      </nav>
    </header>
  );
}
