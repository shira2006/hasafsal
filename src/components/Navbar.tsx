import logo from "../assets/logo.svg";

/** סרגל עליון: הלוגו (ספסל בעיפרון עם המילה "הספסל"). */
export default function Navbar() {
  return (
    <header className="navbar">
      <img className="logo" src={logo} alt="הספסל" />
      <span className="spacer" />
    </header>
  );
}
