"use client";

const columns = {
  Product: ["Features", "AI System", "Timeline", "Results"],
  Platform: ["Semantic Search", "Flashcards", "Clip Extraction", "Learning Paths"],
  Company: ["About", "Contact", "Security", "Privacy"],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-black/10 py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-sm font-bold text-white">N</span>
              <span className="text-xl font-bold tracking-tight text-black">
                neural<span className="text-[#ff6400]">ux</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-base leading-7 text-black/54">
              AI-powered learning for lectures, courses, revision, and deep study sessions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(columns).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-bold text-black">{title}</h3>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-black/50 transition-colors duration-300 hover:text-[#ff6400]">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-black/42">© 2026 Neuralux. All rights reserved.</p>
          <div className="flex gap-4">
            {["X", "GitHub", "Discord"].map((item) => (
              <a key={item} href="#" className="text-sm text-black/42 transition-colors duration-300 hover:text-[#ff6400]">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
