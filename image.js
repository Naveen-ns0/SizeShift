(() => {
const {$,fmt,base,dropzone}=window.SS;
// ---------- IMAGE ----------
  let bmp, ratio, iname;
  const iw = $("#iw"), ih = $("#ih");

  dropzone($("#idrop"), $("#ifile"), async f => {
    if (!f.type.startsWith("image/")) return alert("Please choose an image file.");
    try { bmp = await createImageBitmap(f); } catch { return alert("This image could not be read. Try JPEG, PNG or WebP."); }
    ratio = bmp.width / bmp.height; iname = base(f.name);
    iw.value = bmp.width; ih.value = bmp.height;
    $("#iinfo").textContent = `Original: ${bmp.width} x ${bmp.height} px, ${fmt(f.size)}`;
    $("#ictl").hidden = false; $("#ires").hidden = true;
  });
  iw.oninput = () => { if ($("#ilock").checked) ih.value = Math.max(1, Math.round(iw.value / ratio)); };
  ih.oninput = () => { if ($("#ilock").checked) iw.value = Math.max(1, Math.round(ih.value * ratio)); };
  document.querySelectorAll(".chip").forEach(c => c.onclick = () => {
    iw.value = Math.max(1, Math.round(bmp.width * c.dataset.s));
    ih.value = Math.max(1, Math.round(bmp.height * c.dataset.s));
  });

  // Step by 2x at most so enlarging and shrinking both stay smooth
  function scale(src, w, h) {
    let cur = src, cw = src.width, ch = src.height;
    while (cw !== w || ch !== h) {
      const nw = w > cw ? Math.min(w, cw * 2) : Math.max(w, Math.ceil(cw / 2));
      const nh = h > ch ? Math.min(h, ch * 2) : Math.max(h, Math.ceil(ch / 2));
      const c = document.createElement("canvas"); c.width = nw; c.height = nh;
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(cur, 0, 0, nw, nh);
      cur = c; cw = nw; ch = nh;
    }
    return cur;
  }
  const toBlob = (c, t, q) => new Promise(r => c.toBlob(r, t, q));
  async function encode(c, type, kb) {
    if (!kb || type === "image/png") return { blob: await toBlob(c, type, .92), met: !kb };
    let lo = .05, hi = .95, best = null;
    for (let i = 0; i < 8; i++) {
      const m = (lo + hi) / 2, b = await toBlob(c, type, m);
      if (b.size <= kb * 1024) { best = b; lo = m; } else hi = m;
    }
    return best ? { blob: best, met: true } : { blob: await toBlob(c, type, .05), met: false };
  }

  $("#igo").onclick = async () => {
    const w = Math.round(+iw.value), h = Math.round(+ih.value), type = $("#ifmt").value, kb = +$("#ikb").value;
    if (!(w > 0 && h > 0)) return alert("Enter a width and height.");
    if (w > 16000 || h > 16000 || w * h > 40e6) return alert("That size is too large for a browser. Try under 40 megapixels.");
    $("#igo").disabled = true;
    try {
      const out = document.createElement("canvas"); out.width = w; out.height = h;
      const x = out.getContext("2d");
      if (type !== "image/png") { x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); }
      x.drawImage(scale(bmp, w, h), 0, 0);
      const { blob, met } = await encode(out, type, kb);
      const url = URL.createObjectURL(blob), ext = type.split("/")[1].replace("jpeg", "jpg");
      $("#iprev").src = url;
      $("#iout").textContent = `Result: ${w} x ${h} px, ${fmt(blob.size)}` + (kb && !met ? `. Could not reach ${kb} KB. Try smaller pixels.` : "");
      $("#idl").href = url; $("#idl").download = `${iname}-${w}x${h}.${ext}`;
      $("#ires").hidden = false;
    } catch { alert("Something went wrong. Try a smaller size."); }
    $("#igo").disabled = false;
  };

  })();
