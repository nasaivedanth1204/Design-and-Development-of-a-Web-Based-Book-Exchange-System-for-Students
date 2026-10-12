/** Page heading set over a darker crop of the library backdrop. */
export default function PageBanner({ eyebrow, title, children, width = 'max-w-7xl' }) {
  return (
    <section className="library-backdrop library-backdrop--banner border-b border-leather/50">
      <div className={`mx-auto ${width} px-4 pt-10 pb-8 sm:px-6 sm:pt-14 sm:pb-10`}>
        <p className="eyebrow ornament">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-parchment drop-shadow-[0_2px_10px_rgb(0_0_0/0.6)] sm:text-5xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-vellum">{children}</div>}
      </div>
    </section>
  );
}
