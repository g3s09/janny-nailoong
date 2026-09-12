export default function OutdoorScene({ room }: { room: string }) {
  const space = room === "space";
  const roof = room === "roof";
  const kitchen = room === "kitchen";
  return (
    <svg className="room-art" viewBox="0 0 1100 650" aria-hidden="true">
      <defs>
        <linearGradient id="outdoor-sky" x2="0" y2="1">
          <stop
            stopColor={
              space
                ? "#394356"
                : roof
                  ? "#858797"
                  : kitchen
                    ? "#f1e6cf"
                    : "#c2d6cd"
            }
          />
          <stop
            offset="1"
            stopColor={space ? "#777489" : roof ? "#dec4af" : "#f4ebcf"}
          />
        </linearGradient>
      </defs>
      <path d="M0 0h1100v650H0z" fill="url(#outdoor-sky)" />
      {kitchen ? (
        <>
          <path
            d="M0 160h1100M0 220h1100M0 280h1100M0 340h1100"
            stroke="#d6c6a4"
          />
          <path d="M0 364h1100v200H0z" fill="#c1aa83" />
          <path d="M0 355h1100v18H0z" fill="#f8efd9" />
          <path
            d="M0 395h1100M230 375v184M460 375v184M800 375v184"
            stroke="#a99272"
            strokeWidth="3"
          />
          <path d="M742 350h176v-85H742z" fill="#8c9585" />
          <path d="M765 296h132M765 315h132" stroke="#d4d6bc" />
          <circle cx="950" cy="350" r="33" fill="#c38865" />
          <path d="M919 350h63" stroke="#936749" strokeWidth="3" />
        </>
      ) : space ? (
        <>
          <circle cx="290" cy="190" r="67" fill="#ccae92" />
          <ellipse
            cx="290"
            cy="190"
            rx="110"
            ry="18"
            fill="none"
            stroke="#e3c9a8"
            strokeWidth="14"
            transform="rotate(-25 290 190)"
          />
          <circle cx="862" cy="157" r="35" fill="#e7d4b2" />
          {Array.from({ length: 35 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 137 + 55) % 1100}
              cy={(i * 79 + 50) % 430}
              r={(i % 3) + 1}
              fill="#fff3d1"
            />
          ))}
        </>
      ) : (
        <>
          <circle cx="819" cy="135" r="40" fill="#fff1cb" />
          <path
            d="M0 324q110-150 250-40t270-40 310 60 270-70v366H0Z"
            fill="#9cae94"
          />
          <path d="M0 397q180-129 350-10t300-12 450-21v296H0Z" fill="#7e957f" />
          {roof && (
            <>
              <path d="M0 354h1100v116H0z" fill="#b8a693" />
              <path d="M0 345h1100v13H0z" fill="#daccb9" />
              <path
                d="M0 398h1100M90 355v116M290 355v116M490 355v116M690 355v116M890 355v116"
                stroke="#9d8e7f"
              />
            </>
          )}
        </>
      )}
      <path
        d="M0 475h1100v175H0z"
        fill={
          space ? "#a9a0a1" : roof ? "#c4b4a4" : kitchen ? "#dcc9a5" : "#b4bd97"
        }
      />
      <ellipse
        cx="554"
        cy="536"
        rx="225"
        ry="70"
        fill={space ? "#d0c7bf" : "#e0d8b6"}
      />
      <path d="M151 314h110v88H151z" fill="#af7a65" />
      <path d="M139 311l67-39 67 39" fill="#c89575" />
      <path d="M174 342h65v7h-65z" fill="#624b40" />
      <path d="M201 402v81" stroke="#a38765" strokeWidth="10" />
      <path d="M820 531h114v64H820zM811 519h132v20H811z" fill="#c2956f" />
      <path d="M870 520h14v75h-14z" fill="#eaddbb" />
      <path d="M278 449h82v35h-82z" fill="#987559" />
      <path d="M907 269h76v84h-76z" fill="#fff5d8" />
      <path d="M907 269h76v21h-76z" fill="#a4ad8b" />
      <path d="M468 143h103v100H468zM595 129h91v100h-91z" fill="#fdf1d7" />
      <path d="M480 153h79v58h-79z" fill="#b9c1a5" />
      <path d="M640 194c-46-30-19-52 0-30 20-22 41 6 0 30" fill="#cba18b" />
      <path d="M0 70q550 95 1100 0" fill="none" stroke="#a39178" />
      {Array.from({ length: 14 }, (_, i) => (
        <circle
          key={i}
          cx={i * 80 + 30}
          cy={80 + Math.sin((i / 14) * Math.PI) * 37}
          r="4"
          fill="#ffe4a0"
        />
      ))}
    </svg>
  );
}
