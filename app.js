/* TrimKits web store - cart, checkout and GitHub order writing. */
(function () {
  "use strict";

  var config = window.STORE_CONFIG || {};
  var cart = []; // {item, qty}

  var catalogEl = document.getElementById("catalog");
  var cartEl = document.getElementById("cart");
  var userEl = document.getElementById("mc-user");
  var countEl = document.getElementById("cart-count");
  var placeBtn = document.getElementById("place-order");
  var statusEl = document.getElementById("order-status");
  var banner = document.getElementById("checkout-banner");
  var bannerText = document.getElementById("banner-text");
  var bannerClose = document.getElementById("banner-close");

  // ---- Catalog ------------------------------------------------------------

  function loadCatalog() {
    fetch("catalog.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        (data.items || []).forEach(renderItem);
      })
      .catch(function (err) {
        catalogEl.innerHTML = '<p class="hint">Could not load catalog.json: ' + escapeHtml(err.message) + "</p>";
      });
  }

  function renderItem(item) {
    var card = document.createElement("div");
    card.className = "item";
    card.innerHTML =
      '<div class="icon">' + escapeHtml(item.icon || "🎁") + "</div>" +
      "<h3>" + escapeHtml(item.name) + "</h3>" +
      '<div class="type">' + escapeHtml(item.type) + "</div>" +
      '<div class="desc">' + escapeHtml(item.description || "") + "</div>" +
      '<div class="price">$0.00</div>';
    var button = document.createElement("button");
    button.textContent = "Buy";
    button.addEventListener("click", function () { addToCart(item); });
    card.appendChild(button);
    catalogEl.appendChild(card);
  }

  // ---- Cart ---------------------------------------------------------------

  function addToCart(item) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].item.id === item.id) {
        cart[i].qty++;
        renderCart();
        return;
      }
    }
    cart.push({ item: item, qty: 1 });
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (line) { return line.item.id !== id; });
    renderCart();
  }

  function renderCart() {
    cartEl.innerHTML = "";
    if (cart.length === 0) {
      cartEl.innerHTML = '<li class="empty">Nothing selected yet — click Buy on an item below.</li>';
    } else {
      cart.forEach(function (line) {
        var li = document.createElement("li");
        var left = document.createElement("span");
        left.textContent = line.item.name + " ";
        var qty = document.createElement("span");
        qty.className = "qty";
        qty.textContent = "×" + line.qty;
        left.appendChild(qty);
        var remove = document.createElement("button");
        remove.textContent = "✕";
        remove.title = "Remove";
        remove.addEventListener("click", function () { removeFromCart(line.item.id); });
        li.appendChild(left);
        li.appendChild(remove);
        cartEl.appendChild(li);
      });
    }
    var total = cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
    countEl.textContent = String(total);
    updatePlaceButton();
  }

  function updatePlaceButton() {
    placeBtn.disabled = cart.length === 0 || userEl.value.trim().length === 0;
  }

  userEl.addEventListener("input", updatePlaceButton);

  // ---- Checkout -----------------------------------------------------------

  placeBtn.addEventListener("click", function () {
    var user = userEl.value.trim();
    if (!user) {
      setStatus("Tell us the Minecraft username to send the stuff to.", false);
      return;
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) {
      setStatus("That does not look like a Minecraft username (3-16 letters/numbers/_).", false);
      return;
    }
    placeBtn.disabled = true;
    setStatus("Placing order...", true);

    // One order per cart line keeps the mod's delivery messages readable.
    var orders = cart.map(function (line) {
      return {
        id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
        user: user,
        type: line.item.type,
        value: String(line.item.value),
        item: line.item.name,
        qty: line.qty,
        created: new Date().toISOString()
      };
    });

    submitOrders(orders);
  });

  function submitOrders(orders) {
    if (config.token) {
      commitWithToken(orders);
    } else {
      fallbackIssue(orders);
    }
  }

  // Path 1: commit orders.json directly with the configured token.
  function commitWithToken(orders) {
    var apiUrl = "https://api.github.com/repos/" + config.repo + "/contents/orders.json";
    fetch(apiUrl + "?ref=" + encodeURIComponent(config.branch), {
      headers: { Authorization: "token " + config.token, Accept: "application/vnd.github+json" }
    })
      .then(function (r) {
        if (r.status === 404) { return { sha: null, content: [] }; }
        if (!r.ok) { throw new Error("GitHub HTTP " + r.status); }
        return r.json().then(function (data) {
          return { sha: data.sha, content: JSON.parse(atob(data.content)) };
        });
      })
      .then(function (file) {
        var all = file.content.concat(orders);
        return fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: "token " + config.token,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "webstore: " + orders.length + " order(s) for " + orders[0].user,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(all, null, 2)))),
            branch: config.branch,
            sha: file.sha || undefined
          })
        });
      })
      .then(function (r) {
        if (!r.ok) { throw new Error("GitHub HTTP " + r.status); }
        onOrdered(orders, "Order placed! Join the server — the mod delivers it automatically.");
      })
      .catch(function (err) {
        setStatus("Could not reach GitHub (" + err.message + "). Showing the fallback instead.", false);
        fallbackIssue(orders);
      });
  }

  // Path 2: no token - pre-fill a GitHub issue that maintainers can apply,
  // or copy the order JSON to paste into orders.json yourself.
  function fallbackIssue(orders) {
    var title = "Webstore order: " + orders[0].user + " (" + orders.length + " item(s))";
    var body = orders.map(function (o) {
      return "```json\n" + JSON.stringify(o) + "\n```";
    }).join("\n") +
      "\n\n_Append the JSON blocks above to `orders.json` to deliver this order._";
    var issueUrl = "https://github.com/" + config.repo + "/issues/new?title=" +
      encodeURIComponent(title) + "&body=" + encodeURIComponent(body);

    // Also stash it locally so nothing is lost if the tab closes.
    try {
      var stored = JSON.parse(localStorage.getItem("trimskits-orders") || "[]");
      localStorage.setItem("trimskits-orders", JSON.stringify(stored.concat(orders)));
    } catch (ignored) { /* private mode etc. */ }

    window.open(issueUrl, "_blank");
    onOrdered(orders,
      "Order saved! GitHub issue opened — once the maintainers add it to orders.json, the mod delivers it. " +
      "A copy is also kept in this browser (localStorage).");
  }

  function onOrdered(orders, message) {
    setStatus("✅ " + message, true);
    showBanner("✅ " + message);
    cart = [];
    renderCart();
  }

  // ---- Small helpers ------------------------------------------------------

  function setStatus(text, ok) {
    statusEl.textContent = text;
    statusEl.className = "status " + (ok ? "ok" : "err");
  }

  function showBanner(text) {
    bannerText.textContent = text;
    banner.classList.remove("hidden", "error");
  }

  bannerClose.addEventListener("click", function () { banner.classList.add("hidden"); });

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  loadCatalog();
  renderCart();
})();
