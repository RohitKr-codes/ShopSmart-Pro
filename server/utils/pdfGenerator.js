const PDFDocument = require('pdfkit');

const generateInvoicePDF = (bill, items, user, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${bill.bill_number}.pdf"`);
  doc.pipe(res);

  const PRIMARY = '#6366f1';
  const DARK = '#1e293b';
  const MUTED = '#64748b';
  const LIGHT = '#f8fafc';
  const BORDER = '#e2e8f0';
  const SUCCESS = '#10b981';

  const pageW = doc.page.width - 100;

  // ── HEADER BACKGROUND ──
  doc.rect(0, 0, doc.page.width, 140).fill(PRIMARY);

  // Shop name
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(24)
    .text(user?.shop_name || 'StockMaster Pro', 50, 35);

  doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.8)')
    .text(user?.address || '', 50, 66)
    .text(user?.phone ? `Phone: ${user.phone}` : '', 50, 80)
    .text(user?.email || '', 50, 94);

  // INVOICE label on right
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#fff')
    .text('INVOICE', 350, 38, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.85)')
    .text(bill.bill_number, 350, 76, { width: 200, align: 'right' })
    .text(`Date: ${new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 350, 92, { width: 200, align: 'right' });

  // ── BILL INFO STRIP ──
  let y = 155;
  doc.fillColor(LIGHT).rect(50, y, pageW, 70).fill(LIGHT);
  doc.rect(50, y, pageW, 70).stroke(BORDER);

  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text('BILL TO', 66, y + 10);
  doc.font('Helvetica').fontSize(11).fillColor(DARK)
    .text(bill.customer_name || 'Walk-in Customer', 66, y + 24);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED).text('PAYMENT METHOD', 300, y + 10);
  doc.font('Helvetica').fontSize(11).fillColor(DARK).text((bill.payment_method || 'cash').toUpperCase(), 300, y + 24);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED).text('STATUS', 430, y + 10);
  doc.fillColor(SUCCESS).font('Helvetica-Bold').fontSize(11).text('● PAID', 430, y + 24);

  // ── ITEMS TABLE ──
  y = 245;
  const cols = { no: 50, name: 75, qty: 300, price: 360, total: 460 };

  // Table header
  doc.rect(50, y, pageW, 28).fill(PRIMARY);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);
  doc.text('#', cols.no + 2, y + 9);
  doc.text('PRODUCT NAME', cols.name, y + 9);
  doc.text('QTY', cols.qty, y + 9);
  doc.text('PRICE', cols.price, y + 9);
  doc.text('TOTAL', cols.total, y + 9, { width: 90, align: 'right' });

  y += 28;
  doc.font('Helvetica').fontSize(10);

  items.forEach((item, idx) => {
    const rowH = 28;
    const bg = idx % 2 === 0 ? '#fff' : '#f8fafc';
    doc.rect(50, y, pageW, rowH).fill(bg);

    doc.fillColor(MUTED).text(String(idx + 1), cols.no + 2, y + 9);
    doc.fillColor(DARK).font('Helvetica-Bold').text(item.product_name, cols.name, y + 9, { width: 210 });
    doc.font('Helvetica').fillColor(DARK).text(String(item.quantity), cols.qty, y + 9);
    doc.text(`Rs.${parseFloat(item.price).toFixed(2)}`, cols.price, y + 9);
    doc.font('Helvetica-Bold').text(`Rs.${parseFloat(item.total).toFixed(2)}`, cols.total, y + 9, { width: 90, align: 'right' });

    // row border
    doc.moveTo(50, y + rowH).lineTo(50 + pageW, y + rowH).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += rowH;
  });

  // ── TOTALS BOX ──
  y += 16;
  const totalsX = 330;
  const totalsW = pageW - (totalsX - 50);

  const drawTotalRow = (label, value, bold = false, color = DARK) => {
    if (bold) {
      doc.rect(totalsX, y, totalsW, 30).fill(PRIMARY);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(12)
        .text(label, totalsX + 14, y + 9)
        .text(value, totalsX, y + 9, { width: totalsW - 14, align: 'right' });
      y += 30;
    } else {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10)
        .text(label, totalsX + 14, y + 7);
      doc.fillColor(DARK).font('Helvetica').fontSize(10)
        .text(value, totalsX, y + 7, { width: totalsW - 14, align: 'right' });
      doc.moveTo(totalsX, y + 26).lineTo(totalsX + totalsW, y + 26).strokeColor(BORDER).lineWidth(0.5).stroke();
      y += 26;
    }
  };

  drawTotalRow('Subtotal', `Rs.${parseFloat(bill.subtotal).toFixed(2)}`);
  if (bill.discount > 0) drawTotalRow('Discount', `-Rs.${parseFloat(bill.discount).toFixed(2)}`);
  drawTotalRow(`GST (${bill.gst_percent}%)`, `Rs.${parseFloat(bill.gst_amount).toFixed(2)}`);
  drawTotalRow('TOTAL AMOUNT', `Rs.${parseFloat(bill.total).toFixed(2)}`, true);

  // ── NOTES ──
  if (bill.notes) {
    y += 20;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('Notes:', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(bill.notes, 50, y + 14, { width: pageW });
  }

  // ── FOOTER ──
  const footerY = doc.page.height - 70;
  doc.rect(0, footerY, doc.page.width, 70).fill(LIGHT);
  doc.moveTo(0, footerY).lineTo(doc.page.width, footerY).strokeColor(BORDER).lineWidth(1).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY)
    .text('Thank you for your business!', 50, footerY + 16, { align: 'center', width: pageW });
  doc.font('Helvetica').fontSize(9).fillColor(MUTED)
    .text(`Generated by StockMaster Pro • ${new Date().toLocaleDateString('en-IN')}`, 50, footerY + 34, { align: 'center', width: pageW });

  doc.end();
};

module.exports = { generateInvoicePDF };