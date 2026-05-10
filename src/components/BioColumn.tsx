// Left column from the sketch: a short bio about the artist plus
// contact lines. Static content for now — change the strings below
// when you have the real bio. (Keeping content here, not in the DB,
// because it changes ~never. Move to DB later if you want to edit
// from the admin UI.)
export function BioColumn() {
  return (
    <aside className="space-y-12 text-sm leading-relaxed">
      <section>
        <h2 className="font-serif text-xs tracking-[0.3em] text-muted mb-4">
          [ ABOUT ]
        </h2>
        <p className="text-text/90">
          Some mambo jambo about the artist goes here. Two or three short
          sentences works best — visitors want to see the work, not read.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xs tracking-[0.3em] text-muted mb-4">
          [ CONTACT ]
        </h2>
        <ul className="space-y-2">
          <li>
            <a
              href="mailto:hello@syloline.example"
              className="text-text hover:text-brand-hi transition-colors"
            >
              hello@syloline.example
            </a>
          </li>
          <li>
            <a
              href="https://instagram.com/syloline"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:text-brand-hi transition-colors"
            >
              @syloline
            </a>
          </li>
        </ul>
      </section>
    </aside>
  );
}
