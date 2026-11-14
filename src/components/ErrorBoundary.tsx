import { Component, type ReactNode } from "react";
import bench from "../assets/bench-generic.svg";

interface State { failed: boolean }

/** תופס תקלות לא צפויות בתצוגה, ומציג מסך מעוצב עם רענון במקום מסך לבן. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: unknown) { console.error(error); }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="crash" role="alert">
        <img src={bench} alt="" />
        <h1>אופס, משהו השתבש</h1>
        <p>קרתה לנו תקלה. אפשר לנסות לרענן את הדף, ואם זה חוזר, ספרו לנו דרך "הצעות לחידושים".</p>
        <button type="button" className="btn" onClick={() => location.reload()}>רענון הדף</button>
      </main>
    );
  }
}
