"use client";
import { useState } from "react";
import Nailoong from "./Nailoong";
export default function HugMessage() {
  const [opened, setOpened] = useState(false);
  return (
    <div className="hug-message">
      {opened && (
        <div className="hug-reveal">
          <Nailoong animation="hug" interactive={false} size={130} />
          <span aria-hidden="true">♡</span>
        </div>
      )}
      <button
        type="button"
        className="text-button"
        onClick={() => setOpened((value) => !value)}
      >
        {opened ? "Cerrar abrazo" : "Te mando un abrazo ♡"}
      </button>
    </div>
  );
}
