import React, { useEffect, useMemo, useState } from "react";

const categories = ["Everything", "Everyday", "Streetwear", "Occasion"];
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Everything");
  const [bag, setBag] = useState({});
  const [bagOpen, setBagOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState("idle");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then(setProducts)
      .catch(() => setError("The collection could not load. Please refresh in a moment."));
  }, []);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "Everything" || product.category === category;
    const matchesSearch = `${product.name} ${product.color}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [products, category, search]);

  const bagItems = products.filter((product) => bag[product.id]);
  const itemCount = Object.values(bag).reduce((total, quantity) => total + quantity, 0);
  const total = bagItems.reduce((sum, product) => sum + product.price * bag[product.id], 0);

  function updateBag(productId, amount) {
    setBag((current) => {
      const nextQuantity = (current[productId] ?? 0) + amount;
      const next = { ...current };
      if (nextQuantity < 1) delete next[productId];
      else next[productId] = Math.min(nextQuantity, 20);
      return next;
    });
  }

  async function placeOrder(event) {
    event.preventDefault();
    setCheckoutState("loading");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          items: bagItems.map((product) => ({ productId: product.id, quantity: bag[product.id] })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't place your order.");
      setCheckoutState("success");
      setBag({});
    } catch (orderError) {
      setError(orderError.message);
      setCheckoutState("idle");
    }
  }

  return (
    <>
      <div className="announcement">GOOD CLOTHES. BETTER MOOD. <span>Free shipping on orders over ₹2,500</span></div>
      <header className="site-header">
        <a className="logo-link" href="#top" aria-label="Wah!Fur home"><img src="/assets/wahfurname.png" alt="Wah!Fur" /></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#collection">The collection</a>
          <a href="#story">Our kind of good</a>
          <a href="#footer">Find us</a>
        </nav>
        <button className="bag-trigger" type="button" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${itemCount} items`}>
          <span className="bag-icon" aria-hidden="true">↗</span> Your bag <span className="bag-count">{String(itemCount).padStart(2, "0")}</span>
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A LITTLE EXTRA, EVERY DAY</p>
            <h1 id="hero-title">Dress like<br />you <em>mean it.</em></h1>
            <p className="hero-description">The fit that feels like you. The look that says the rest. Meet clothes made for whatever you feel like being today.</p>
            <a className="round-link" href="#collection">Find your thing <span aria-hidden="true">↘</span></a>
            <div className="hero-note"><span className="sun-doodle" aria-hidden="true">✳</span> Not made to blend in. Neither are you.</div>
          </div>
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1500&q=85" alt="Fashion editorial from the latest collection" />
            <div className="hero-sticker"><span>WEAR<br />YOUR<br /><i>mood.</i></span></div>
            <div className="hero-caption"><span>01 / THE GOOD MOOD EDIT</span><span>MADE FOR YOUR EVERYDAY</span></div>
          </div>
          <div className="hero-side-note" aria-hidden="true">W!F / 2025 / MADE WITH FEELING</div>
        </section>

        <div className="ticker" aria-label="Style, on your terms"><div className="ticker-track">STYLE, ON YOUR TERMS <span>✳</span> GOOD FIT, GOOD ENERGY <span>✳</span> VERY MUCH YOU <span>✳</span> STYLE, ON YOUR TERMS <span>✳</span> GOOD FIT, GOOD ENERGY <span>✳</span></div></div>

        <section className="collection section-wrap" id="collection">
          <div className="section-heading">
            <div><p className="eyebrow">THE CURRENT OBSESSION</p><h2>Things you'll <em>actually</em> wear.</h2></div>
            <label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search pieces" placeholder="Find a piece..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          </div>
          <div className="collection-tools">
            <div className="filters" role="group" aria-label="Filter by category">
              {categories.map((item) => <button key={item} className={category === item ? "filter active" : "filter"} onClick={() => setCategory(item)} type="button">{item}</button>)}
            </div>
            <span className="result-count">{visibleProducts.length} GOOD THINGS</span>
          </div>
          {error && !bagOpen && <p className="inline-error" role="status">{error}</p>}
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className={`product-image image-tone-${index % 4}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-index">0{index + 1}</span>
                  <button className="add-button" type="button" onClick={() => updateBag(product.id, 1)} aria-label={`Add ${product.name} to your bag`}>+</button>
                </div>
                <div className="product-meta"><div><p className="product-category">{product.category} · {product.color}</p><h3>{product.name}</h3></div><span className="product-price">{money.format(product.price)}</span></div>
              </article>
            ))}
          </div>
          {!visibleProducts.length && !error && <p className="empty-state">No pieces found. Try a different search.</p>}
        </section>

        <section className="story" id="story">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85" alt="A fashion moment from the Wah!Fur collection" loading="lazy" /><span className="story-image-label">GOOD CLOTHES, NO OCCASION NEEDED</span></div>
          <div className="story-copy"><p className="eyebrow">A NOTE FROM US</p><h2>Style should<br />feel like <em>you.</em></h2><p>We make pieces for the everyday main character. Easy to live in, hard to forget, and always a little bit unexpected. Consider this your sign to wear the thing.</p><a href="#collection" className="text-link">Get to know the collection <span aria-hidden="true">↗</span></a><span className="story-scribble" aria-hidden="true">✳</span></div>
        </section>

        <section className="closing-note"><span className="closing-star" aria-hidden="true">✳</span><p>YOUR CLOTHES SHOULD<br />MAKE YOU FEEL LIKE <em>YOU.</em></p><a href="#collection" aria-label="Shop the collection">↗</a></section>
      </main>

      <footer className="site-footer" id="footer"><a className="logo-link footer-mark" href="#top" aria-label="Wah!Fur home"><img src="/assets/wahfurname.png" alt="Wah!Fur" /></a><p>Good clothes. Very good you.</p><div className="contact-links"><a href="tel:8667728554">8667728554</a><a href="mailto:varunprasathdhanabal@gmail.com">varunprasathdhanabal@gmail.com</a></div><small>© 2025 WAH!FUR. MADE WITH FEELING.</small></footer>

      {bagOpen && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBagOpen(false); }}>
        <aside className="bag-drawer" aria-label="Your shopping bag">
          <div className="drawer-heading"><div><p className="eyebrow">YOUR GOOD THINGS</p><h2>The bag <span>({itemCount})</span></h2></div><button type="button" className="close-button" onClick={() => setBagOpen(false)} aria-label="Close bag">×</button></div>
          {checkoutState === "success" ? <div className="success-message"><span>✳</span><h3>It's happening.</h3><p>Your order is in. Keep an eye on your inbox for the next bit.</p><button type="button" className="checkout-button" onClick={() => { setCheckoutState("idle"); setBagOpen(false); }}>Back to the good stuff</button></div> : <>
            <div className="bag-list">{bagItems.length ? bagItems.map((product) => <div className="bag-item" key={product.id}><img src={product.image} alt="" /><div className="bag-item-info"><h3>{product.name}</h3><p>{money.format(product.price)}</p><div className="quantity-control"><button type="button" onClick={() => updateBag(product.id, -1)} aria-label={`Remove one ${product.name}`}>-</button><span>{bag[product.id]}</span><button type="button" onClick={() => updateBag(product.id, 1)} aria-label={`Add one ${product.name}`}>+</button></div></div><span className="bag-item-total">{money.format(product.price * bag[product.id])}</span></div>) : <p className="empty-bag">Nothing in here just yet.<br />Your next favourite is out there.</p>}</div>
            <div className="drawer-bottom"><div className="subtotal"><span>Subtotal</span><strong>{money.format(total)}</strong></div><p className="shipping-note">Shipping calculated after we say hello.</p>{error && <p className="inline-error" role="alert">{error}</p>}
              {bagItems.length > 0 && <form className="checkout-form" onSubmit={placeOrder}><label>Your name<input name="name" placeholder="What should we call you?" required minLength="2" /></label><label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><button className="checkout-button" type="submit" disabled={checkoutState === "loading"}>{checkoutState === "loading" ? "One second..." : "Place my order"}<span aria-hidden="true">↗</span></button></form>}
            </div>
          </>}
        </aside>
      </div>}
    </>
  );
}

export default App;