import logo from "../assets/logo.svg";

interface Props {
  view: "map" | "about";
}

/** סרגל עליון: לוגו, מפה, המשימה שלנו. העמוד הנוכחי מודגש. הניווט הוא לפי hash. */
export default function Navbar({ view }: Props) {
  return (
    <header className="navbar">
      <a className="logo-link" href="#/" aria-label="הספסל, למפה"><img className="logo" src={logo} alt="הספסל" /></a>
      <span className="spacer" />
      <nav className="tabs" aria-label="ניווט ראשי">
        <a href="#/" aria-current={view === "map" ? "page" : undefined}>מפה</a>
        <a href="#/about" aria-current={view === "about" ? "page" : undefined}>המשימה שלנו</a>
      </nav>
    </header>
  );
}
