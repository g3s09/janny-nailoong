export default function RoomArt() {
  return (
    <svg
      className="room-art"
      viewBox="0 0 1100 650"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor="#f7edda" />
          <stop offset="1" stopColor="#e9d9bd" />
        </linearGradient>
        <linearGradient id="floor" x2="0" y2="1">
          <stop stopColor="#e7c9a2" />
          <stop offset="1" stopColor="#f3ddba" />
        </linearGradient>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="var(--sky-top, #b7cfd0)" />
          <stop offset="1" stopColor="var(--sky-bottom, #f4e8c9)" />
        </linearGradient>
        <linearGradient id="blanket" x2="1" y2="1">
          <stop stopColor="#eee5cd" />
          <stop offset="1" stopColor="#c5c2a1" />
        </linearGradient>
        <radialGradient id="light">
          <stop stopColor="#fff9d8" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff9d8" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="9"
            floodColor="#735d3c"
            floodOpacity=".14"
          />
        </filter>
        <pattern
          id="wallpaper"
          width="42"
          height="42"
          patternUnits="userSpaceOnUse"
        >
          <path d="M21 17v8M17 21h8" stroke="#b8a383" strokeOpacity=".13" />
        </pattern>
      </defs>
      <path fill="url(#wall)" d="M0 0h1100v650H0z" />
      <path fill="url(#wallpaper)" d="M0 0h1100v440H0z" />
      <path fill="url(#floor)" d="M0 435h1100v215H0z" />
      <path d="M0 435h1100" stroke="#c3a47b" strokeWidth="10" />
      <path d="M0 444h1100" stroke="#f8edda" strokeWidth="5" />
      <g stroke="#c5a378" opacity=".3">
        <path d="M0 493h1100M0 564h1100M75 650l175-211M410 650l50-211M750 650l-70-211M1060 650L900 439M0 609h1100" />
      </g>
      <ellipse cx="423" cy="426" rx="420" ry="300" fill="url(#light)" />
      <g filter="url(#shadow)">
        <path d="M135 96q0-35 35-35h195q35 0 35 35v226H135Z" fill="#ac8e66" />
        <path d="M145 98q0-27 27-27h191q27 0 27 27v210H145Z" fill="#fff6e4" />
        <path d="M157 99q0-15 15-15h191q15 0 15 15v196H157Z" fill="url(#sky)" />
        <circle cx="325" cy="125" r="22" fill="#fff8d7" />
        <path
          d="M158 244q58-45 112-7t108-17v75H158Z"
          fill="#9fab91"
          opacity=".45"
        />
        <path
          d="M158 274q72-44 122-5t98-6v32H158Z"
          fill="#7d947e"
          opacity=".5"
        />
        <path d="M265 80v221M151 187h232" stroke="#fff6e4" strokeWidth="10" />
        <path d="M124 309h288v15H124z" fill="#c8ab81" />
      </g>
      <path
        d="M113 58q15 130-3 251l48-9q-21-137 10-242Z"
        fill="#fffbef"
        opacity=".85"
      />
      <path
        d="M356 58q34 121 13 240l49 14q-24-140-9-254Z"
        fill="#fffbef"
        opacity=".85"
      />
      <path
        d="M107 58h317"
        stroke="#997b55"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g filter="url(#shadow)" transform="rotate(-5 520 170)">
        <path fill="#b5976b" d="M470 114h98v110h-98z" />
        <path fill="#fffaeb" d="M478 122h82v94h-82z" />
        <path fill="#d8dec4" d="M487 131h64v64h-64z" />
        <path d="M492 187l20-30 13 18 12-13 14 25" fill="#98aa8a" />
        <circle cx="537" cy="145" r="8" fill="#fff5bb" />
        <path d="M499 206h39" stroke="#b59d7d" strokeWidth="2" />
      </g>
      <g filter="url(#shadow)" transform="rotate(4 650 158)">
        <path fill="#b9996c" d="M600 88h93v115h-93z" />
        <path fill="#fff8e8" d="M608 96h77v99h-77z" />
        <path d="M645 163c-45-29-18-51 0-30 21-22 42 6 0 30" fill="#cb9b88" />
        <path d="M626 180h41" stroke="#bda786" strokeWidth="2" />
      </g>
      <path d="M475 70q167-53 330-4" stroke="#aa9575" />
      <g fill="#ffe5a1">
        <circle cx="480" cy="71" r="4" />
        <circle cx="535" cy="58" r="4" />
        <circle cx="591" cy="50" r="4" />
        <circle cx="648" cy="49" r="4" />
        <circle cx="704" cy="52" r="4" />
        <circle cx="760" cy="59" r="4" />
        <circle cx="804" cy="68" r="4" />
      </g>
      <g filter="url(#shadow)">
        <path d="M789 152h207v11H789z" fill="#b79970" />
        <path d="M803 162v17M981 162v17" stroke="#b79970" strokeWidth="7" />
        <path d="M816 99h18v53h-18z" fill="#a6ae92" />
        <path d="M837 88h19v64h-19z" fill="#cfb792" />
        <path d="M860 103h17v49h-17z" fill="#b98673" />
        <path d="M881 98l15-4 15 54-15 4z" fill="#d5c397" />
        <path d="M941 120h30l-5 32h-20z" fill="#c6977f" />
        <path d="M956 122v-23" stroke="#6d825f" strokeWidth="3" />
        <path
          d="M955 113q-31-5-19-25 22 5 19 25M956 106q-3-30 20-21 5 19-20 21"
          fill="#8f9f73"
        />
      </g>
      <ellipse
        cx="553"
        cy="529"
        rx="221"
        ry="81"
        fill="#c5a87c"
        opacity=".16"
      />
      <ellipse cx="548" cy="518" rx="219" ry="77" fill="#eee4c7" />
      <ellipse
        cx="548"
        cy="518"
        rx="203"
        ry="65"
        stroke="#d8cba9"
        strokeWidth="2"
      />
      <ellipse
        cx="548"
        cy="518"
        rx="193"
        ry="57"
        stroke="#d8cba9"
        strokeDasharray="3 7"
      />
      <g filter="url(#shadow)">
        <path d="M751 322q0-15 16-15h217q16 0 16 15v183H751z" fill="#bea27d" />
        <path d="M740 413h273v83H740z" fill="#e2d0b0" />
        <path d="M740 412q0-14 18-14h234q21 0 21 14v24H740z" fill="#fffae8" />
        <path d="M772 357q29-14 65-1l-3 41h-68z" fill="#fffbee" />
        <path d="M846 357q40-13 75 0l12 40h-83z" fill="#f7f0da" />
        <path
          d="M826 398h173q14 0 14 18v57H831q-15-31-5-75"
          fill="url(#blanket)"
        />
        <path
          d="M857 401v69M913 401v69M968 401v69"
          stroke="#b0b18f"
          opacity=".35"
          strokeWidth="2"
        />
        <path d="M753 491v29M994 491v29" stroke="#a88a64" strokeWidth="11" />
      </g>
      <g filter="url(#shadow)">
        <path d="M118 351h149v16H118z" fill="#be9870" />
        <path d="M129 367h125v91H129z" fill="#d2b18b" />
        <path d="M144 381h95v49h-95z" fill="#dfc09a" />
        <circle cx="191" cy="405" r="4" fill="#9b7b57" />
        <path d="M142 451v35M242 451v35" stroke="#a98a62" strokeWidth="9" />
        <path d="M155 345v-53q0-29 30-29h23q29 0 29 29v53z" fill="#b57b67" />
        <path
          d="M167 300h57"
          stroke="#734e46"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M171 322h48v28h-48z" fill="#fff0d4" />
        <path d="M171 322l24 17 24-17" stroke="#c6a481" strokeWidth="2" />
        <path d="M241 280v44" stroke="#8d6957" strokeWidth="4" />
        <path d="M240 281h18v14h-18z" fill="#d9aa7a" />
      </g>
      <g>
        <path
          d="M65 407q-22-88-11-125M65 414q15-103 48-150M67 414q-7-141 6-167"
          stroke="#75855e"
          strokeWidth="4"
        />
        <g fill="#8e9b73">
          <ellipse
            cx="43"
            cy="321"
            rx="15"
            ry="34"
            transform="rotate(-37 43 321)"
          />
          <ellipse
            cx="84"
            cy="294"
            rx="13"
            ry="31"
            transform="rotate(27 84 294)"
          />
          <ellipse
            cx="62"
            cy="263"
            rx="13"
            ry="28"
            transform="rotate(-18 62 263)"
          />
          <ellipse
            cx="105"
            cy="327"
            rx="14"
            ry="32"
            transform="rotate(38 105 327)"
          />
          <ellipse
            cx="48"
            cy="372"
            rx="14"
            ry="31"
            transform="rotate(-45 48 372)"
          />
        </g>
        <path d="M36 403h68l-11 70H47z" fill="#bc957b" />
        <path d="M32 400h77v12H32z" fill="#caa78c" />
      </g>
      <g filter="url(#shadow)" transform="rotate(-9 349 438)">
        <path d="M302 416h86v43h-86z" fill="#9d7357" />
        <path d="M300 409h87v43h-87z" fill="#b18b69" />
        <path d="M310 411v39" stroke="#e4cba7" strokeWidth="2" />
        <path d="M333 426h32M339 432h20" stroke="#ead9b7" strokeWidth="2" />
      </g>
      <g filter="url(#shadow)">
        <path d="M841 547h111v59H841z" fill="#b88968" />
        <path d="M833 537h127v21H833z" fill="#c69a74" />
        <path d="M889 537h13v69h-13z" fill="#eee0bb" />
        <path
          d="M897 538c-53-31-20-41 0 0 30-40 48-22 0 0"
          stroke="#eee0bb"
          strokeWidth="6"
        />
      </g>
      <g transform="rotate(5 932 255)">
        <path d="M899 219h74v84h-74z" fill="#fff8e5" filter="url(#shadow)" />
        <path d="M899 219h74v20h-74z" fill="#b1b797" />
        <path
          d="M916 214v11M956 214v11"
          stroke="#87785c"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M913 252h47M913 267h47M913 282h47M921 246v42M936 246v42M951 246v42"
          stroke="#d7c8a7"
        />
        <circle cx="936" cy="267" r="6" fill="#c18c75" />
      </g>
      <g fill="#fff8da" opacity=".65">
        <circle className="dust" cx="441" cy="283" r="2" />
        <circle className="dust" cx="690" cy="312" r="2" />
        <circle className="dust" cx="340" cy="375" r="2" />
        <circle className="dust" cx="580" cy="102" r="2" />
      </g>
    </svg>
  );
}
