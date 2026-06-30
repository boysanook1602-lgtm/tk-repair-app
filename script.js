// =====================================================
// T&K ELECTRICAL REPAIR CENTER - BILLING SYSTEM
// =====================================================
// สคริปต์ JavaScript สำหรับจัดการบิลและใบเสร็จรับเงิน
// =====================================================

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

/**
 * เริ่มต้นแอปพลิเคชัน
 */
function initializeApp() {
    // กำหนดวันที่ปัจจุบัน
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('billDate').value = today;
    
    // โหลดข้อมูลที่บันทึกไว้ (ถ้ามี)
    loadSavedData();
    
    // คำนวณยอดรวมเบื้องต้น
    calculateTotal();
}

/**
 * ตั้งค่าการฟังเหตุการณ์
 */
function setupEventListeners() {
    // ฟังก์ชันสำหรับกด Enter เพื่อคำนวณ
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateTotal();
            }
        });
    });
}

/**
 * เพิ่มแถวรายการซ่อมใหม่
 */
function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const itemCount = container.children.length;
    const newRow = document.createElement('div');
    newRow.className = 'item-row-card';
    newRow.innerHTML = `
        <button type="button" class="btn-delete" onclick="deleteItem(this)">ลบ</button>
        <label style="font-size: 11px; color:#64748b; font-weight:600;">ชื่ออะไหล่ / รายการบริการ</label>
        <input type="text" placeholder="เช่น เปลี่ยนแคป, ค่าล้างแอร์ด่วน" class="item-name">
        <div class="item-grid">
            <div>
                <label>จำนวน</label>
                <input type="number" value="1" min="1" class="item-qty" oninput="calculateTotal()">
            </div>
            <div>
                <label>ราคา (บาท)</label>
                <input type="number" value="0" min="0" step="0.01" class="item-price" oninput="calculateTotal()">
            </div>
        </div>
    `;
    container.appendChild(newRow);
    calculateTotal();
    // โฟกัสที่ช่องชื่ออะไหล่
    newRow.querySelector('.item-name').focus();
}

/**
 * ลบแถวรายการซ่อม
 */
function deleteItem(button) {
    const itemRow = button.closest('.item-row-card');
    const container = document.getElementById('itemsContainer');
    
    // ต้องมีอย่างน้อย 1 แถว
    if (container.children.length > 1) {
        itemRow.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            itemRow.remove();
            calculateTotal();
        }, 300);
    } else {
        alert('ต้องมีอย่างน้อย 1 รายการซ่อม');
    }
}

/**
 * คำนวณยอดรวมเงิน
 */
function calculateTotal() {
    const items = document.querySelectorAll('.item-row-card');
    let subtotal = 0;
    
    // รวมราคาของแต่ละรายการ
    items.forEach(item => {
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        subtotal += (qty * price);
    });
    
    // ดึงค่าส่วนลด
    const discount = parseFloat(document.getElementById('inputDiscount').value) || 0;
    
    // คำนวณยอดสุทธิ
    const grandTotal = subtotal - discount;
    
    // อัปเดตการแสดงผล
    document.getElementById('txtSubTotal').textContent = formatCurrency(subtotal);
    document.getElementById('txtGrandTotal').textContent = formatCurrency(Math.max(0, grandTotal));
    
    // บันทึกข้อมูล
    saveFormData();
}

/**
 * จัดรูปแบบเงิน (Thai Baht)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * ประมวลผลและออกใบเสร็จ
 */
function processInvoiceNow() {
    // ตรวจสอบข้อมูลที่จำเป็น
    const billNo = document.getElementById('billNo').value.trim();
    const custName = document.getElementById('custName').value.trim();
    const custPhone = document.getElementById('custPhone').value.trim();
    const custDistrict = document.getElementById('custDistrict').value;
    const deviceType = document.getElementById('deviceType').value;
    const items = document.querySelectorAll('.item-row-card');
    
    if (!billNo) {
        alert('⚠️ กรุณากรอกเลขที่บิล');
        return;
    }
    if (!custName) {
        alert('⚠️ กรุณากรอกชื่อลูกค้า');
        return;
    }
    if (!custPhone) {
        alert('⚠️ กรุณากรอกเบอร์โทรศัพท์');
        return;
    }
    if (!custDistrict) {
        alert('⚠️ กรุณาเลือกอำเภอ');
        return;
    }
    
    // ตรวจสอบรายการซ่อม
    let hasValidItem = false;
    items.forEach(item => {
        const name = item.querySelector('.item-name').value.trim();
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        if (name && price > 0) {
            hasValidItem = true;
        }
    });
    
    if (!hasValidItem) {
        alert('⚠️ กรุณากรอกรายการซ่อมและราคา');
        return;
    }
    
    // สร้างและแสดงใบเสร็จ
    generateReceipt();
}

/**
 * สร้างและแสดงใบเสร็จรับเงิน
 */
function generateReceipt() {
    const modal = document.getElementById('previewModal');
    const receiptBody = document.getElementById('receiptBody');
    
    // รวบรวมข้อมูล
    const billNo = document.getElementById('billNo').value;
    const billDate = document.getElementById('billDate').value;
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    const custDistrict = document.getElementById('custDistrict').value;
    const deviceType = document.getElementById('deviceType').value;
    const deviceModel = document.getElementById('deviceModel').value;
    const deviceSymptom = document.getElementById('deviceSymptom').value;
    
    const subtotal = parseFloat(document.getElementById('txtSubTotal').textContent.replace(/[^\d.]/g, ''));
    const discount = parseFloat(document.getElementById('inputDiscount').value) || 0;
    const grandTotal = subtotal - discount;
    
    // สร้าง HTML ของใบเสร็จ
    let itemsHTML = '';
    const items = document.querySelectorAll('.item-row-card');
    items.forEach((item, index) => {
        const name = item.querySelector('.item-name').value;
        const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        const total = qty * price;
        
        if (name && price > 0) {
            itemsHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${name}</td>
                    <td style="text-align: center;">${qty}</td>
                    <td style="text-align: right;">${formatCurrency(price)}</td>
                    <td style="text-align: right;">${formatCurrency(total)}</td>
                </tr>
            `;
        }
    });
    
    // สร้าง HTML แบบเต็ม
    const receiptHTML = `
        <div style="text-align:center; margin-bottom:12px;">
            <h2 style="font-size:24px; color:#0284c7; margin:0;">T&K</h2>
            <span style="font-size:9px; font-weight:bold; color:#475569; display:block;">ELECTRICAL APPLIANCE REPAIR CENTER</span>
            <span style="font-size:11px; display:block; margin-top:2px;">รับซ่อมในสุรินทร์ ทุกอำเภอ • โทร. 063-671-8151</span>
            <hr style="border: 1px dashed #cbd5e1; margin: 8px 0;">
        </div>
        
        <h3 style="background:#0284c7; color:#fff; text-align:center; padding:6px; font-size:14px; margin:8px 0; border-radius:4px;">ใบเสร็จรับเงิน / ใบแจ้งหนี้</h3>
        
        <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
            <tr>
                <td><strong>เลขที่บิล:</strong> ${escapeHtml(billNo)}</td>
                <td style="text-align: right;"><strong>วันที่:</strong> ${formatThaiDate(billDate)}</td>
            </tr>
        </table>
        
        <div style="background: #f0f9ff; padding: 10px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #0284c7;">
            <div style="font-size: 11px; margin-bottom: 4px;">
                <strong>ชื่อลูกค้า:</strong> ${escapeHtml(custName)}
            </div>
            <div style="font-size: 11px; margin-bottom: 4px;">
                <strong>เบอร์โทร:</strong> ${escapeHtml(custPhone)} | <strong>อำเภอ:</strong> ${escapeHtml(custDistrict)}
            </div>
            <div style="font-size: 11px;">
                <strong>ประเภท:</strong> ${escapeHtml(deviceType)} | <strong>ยี่ห้อ/รุ่น:</strong> ${escapeHtml(deviceModel)}
            </div>
            ${deviceSymptom ? `<div style="font-size: 11px; margin-top: 4px;"><strong>อาการเสีย:</strong> ${escapeHtml(deviceSymptom)}</div>` : ''}
        </div>
        
        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width: 8%;">ลำดับ</th>
                    <th style="width: 40%;">รายการ</th>
                    <th style="width: 12%; text-align: center;">จำนวน</th>
                    <th style="width: 20%; text-align: right;">ราคา</th>
                    <th style="width: 20%; text-align: right;">รวม</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
        
        <div style="border-top: 2px solid #cbd5e1; padding-top: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>รวมเงินสินค้า:</span>
                <span>${formatCurrency(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a;">
                <span>ส่วนลด:</span>
                <span>-${formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #b45309;">
                <span>ยอดสุทธิที่ต้องจ่าย:</span>
                <span>${formatCurrency(Math.max(0, grandTotal))}</span>
            </div>
        </div>
        
        <hr style="border: 1px dashed #cbd5e1; margin: 12px 0;">
        
        <div style="text-align: center; font-size: 11px; color: #64748b; margin: 10px 0;">
            <p>ขอบคุณที่ใช้บริการ T&K Electrical Repair Center</p>
            <p style="margin: 4px 0;">โปรดเก็บใบเสร็จไว้เพื่อประกอบการอ้างอิง</p>
            <p style="font-size: 10px; margin: 4px 0;">พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        </div>
    `;
    
    receiptBody.innerHTML = receiptHTML;
    modal.style.display = 'flex';
    
    // บันทึกข้อมูล
    saveFormData();
}

/**
 * ปิด modal
 */
function closeModal() {
    const modal = document.getElementById('previewModal');
    modal.style.display = 'none';
}

/**
 * พิมพ์ใบเสร็จ
 */
function printReceipt() {
    const printContent = document.getElementById('previewModal').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>ใบเสร็จรับเงิน</title>
            <style>
                body { 
                    font-family: 'Arial', 'Segoe UI', sans-serif; 
                    padding: 10px; 
                    color: #000;
                    background: #fff;
                }
                .modal-content {
                    width: 100%;
                    max-width: 400px;
                    margin: auto;
                    padding: 16px;
                    background: #fff;
                }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
                th { background: #f1f5f9; }
                .receipt-table { font-size: 12px; }
                @media print {
                    .close-modal-btn, .print-btn, .download-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="modal-content">
                ${printContent.replace(/<button[^>]*>.*?<\/button>/g, '')}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * ดาวน์โหลด CSV
 */
function downloadCSV() {
    const billNo = document.getElementById('billNo').value;
    const billDate = document.getElementById('billDate').value;
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    const custDistrict = document.getElementById('custDistrict').value;
    const deviceType = document.getElementById('deviceType').value;
    const deviceModel = document.getElementById('deviceModel').value;
    
    let csv = 'T&K ELECTRICAL REPAIR CENTER - BILLING DATA\n';
    csv += `เลขที่บิล,${billNo}\n`;
    csv += `วันที่,${billDate}\n`;
    csv += `ชื่อลูกค้า,${custName}\n`;
    csv += `เบอร์โทร,${custPhone}\n`;
    csv += `อำเภอ,${custDistrict}\n`;
    csv += `ประเภท,${deviceType}\n`;
    csv += `ยี่ห้อ/รุ่น,${deviceModel}\n`;
    csv += '\n';
    csv += 'ลำดับ,รายการ,จำนวน,ราคา,รวม\n';
    
    const items = document.querySelectorAll('.item-row-card');
    items.forEach((item, index) => {
        const name = item.querySelector('.item-name').value;
        const qty = item.querySelector('.item-qty').value;
        const price = item.querySelector('.item-price').value;
        const total = parseFloat(qty) * parseFloat(price);
        csv += `${index + 1},"${name}",${qty},${price},${total}\n`;
    });
    
    const subtotal = parseFloat(document.getElementById('txtSubTotal').textContent.replace(/[^\d.]/g, ''));
    const discount = parseFloat(document.getElementById('inputDiscount').value) || 0;
    const grandTotal = subtotal - discount;
    
    csv += '\n';
    csv += `รวมเงิน,${subtotal}\n`;
    csv += `ส่วนลด,${discount}\n`;
    csv += `ยอดสุทธิ,${Math.max(0, grandTotal)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${billNo}_${Date.now()}.csv`;
    link.click();
}

/**
 * ดาวน์โหลด JSON
 */
function downloadJSON() {
    const billNo = document.getElementById('billNo').value;
    const billDate = document.getElementById('billDate').value;
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    const custDistrict = document.getElementById('custDistrict').value;
    const deviceType = document.getElementById('deviceType').value;
    const deviceModel = document.getElementById('deviceModel').value;
    const deviceSymptom = document.getElementById('deviceSymptom').value;
    
    const items = [];
    document.querySelectorAll('.item-row-card').forEach(item => {
        items.push({
            name: item.querySelector('.item-name').value,
            qty: parseFloat(item.querySelector('.item-qty').value),
            price: parseFloat(item.querySelector('.item-price').value),
            total: parseFloat(item.querySelector('.item-qty').value) * parseFloat(item.querySelector('.item-price').value)
        });
    });
    
    const subtotal = parseFloat(document.getElementById('txtSubTotal').textContent.replace(/[^\d.]/g, ''));
    const discount = parseFloat(document.getElementById('inputDiscount').value) || 0;
    
    const data = {
        billing: {
            billNo,
            billDate,
            createdAt: new Date().toISOString()
        },
        customer: {
            name: custName,
            phone: custPhone,
            district: custDistrict
        },
        device: {
            type: deviceType,
            model: deviceModel,
            symptom: deviceSymptom
        },
        items,
        summary: {
            subtotal,
            discount,
            grandTotal: subtotal - discount
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${billNo}_${Date.now()}.json`;
    link.click();
}

/**
 * บันทึกข้อมูลฟอร์มลงใน localStorage
 */
function saveFormData() {
    const items = [];
    document.querySelectorAll('.item-row-card').forEach(item => {
        items.push({
            name: item.querySelector('.item-name').value,
            qty: item.querySelector('.item-qty').value,
            price: item.querySelector('.item-price').value
        });
    });
    
    const formData = {
        billNo: document.getElementById('billNo').value,
        billDate: document.getElementById('billDate').value,
        custName: document.getElementById('custName').value,
        custPhone: document.getElementById('custPhone').value,
        custDistrict: document.getElementById('custDistrict').value,
        deviceType: document.getElementById('deviceType').value,
        deviceModel: document.getElementById('deviceModel').value,
        deviceSymptom: document.getElementById('deviceSymptom').value,
        discount: document.getElementById('inputDiscount').value,
        items
    };
    
    localStorage.setItem('tkRepairFormData', JSON.stringify(formData));
}

/**
 * โหลดข้อมูลจาก localStorage
 */
function loadSavedData() {
    const saved = localStorage.getItem('tkRepairFormData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            document.getElementById('custName').value = data.custName || '';
            document.getElementById('custPhone').value = data.custPhone || '';
            document.getElementById('custDistrict').value = data.custDistrict || '';
            document.getElementById('deviceType').value = data.deviceType || '';
            document.getElementById('deviceModel').value = data.deviceModel || '';
            document.getElementById('deviceSymptom').value = data.deviceSymptom || '';
            document.getElementById('inputDiscount').value = data.discount || 0;
            
            // โหลดรายการซ่อม
            const container = document.getElementById('itemsContainer');
            if (data.items && data.items.length > 0) {
                container.innerHTML = '';
                data.items.forEach(item => {
                    const newRow = document.createElement('div');
                    newRow.className = 'item-row-card';
                    newRow.innerHTML = `
                        <button type="button" class="btn-delete" onclick="deleteItem(this)">ลบ</button>
                        <label style="font-size: 11px; color:#64748b; font-weight:600;">ชื่ออะไหล่ / รายการบริการ</label>
                        <input type="text" placeholder="เช่น เปลี่ยนแคป, ค่าล้างแอร์ด่วน" class="item-name" value="${item.name}">
                        <div class="item-grid">
                            <div>
                                <label>จำนวน</label>
                                <input type="number" value="${item.qty}" min="1" class="item-qty" oninput="calculateTotal()">
                            </div>
                            <div>
                                <label>ราคา (บาท)</label>
                                <input type="number" value="${item.price}" min="0" step="0.01" class="item-price" oninput="calculateTotal()">
                            </div>
                        </div>
                    `;
                    container.appendChild(newRow);
                });
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

/**
 * ล้างข้อมูลทั้งหมด
 */
function clearAllData() {
    if (confirm('คุณแน่ใจหรือที่จะล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้')) {
        localStorage.removeItem('tkRepairFormData');
        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('custDistrict').value = '';
        document.getElementById('deviceType').value = 'TV REPAIR (ซ่อมทีวี)';
        document.getElementById('deviceModel').value = '';
        document.getElementById('deviceSymptom').value = '';
        document.getElementById('inputDiscount').value = 0;
        
        const container = document.getElementById('itemsContainer');
        container.innerHTML = `
            <div class="item-row-card">
                <label style="font-size: 11px; color:#64748b; font-weight:600;">ชื่ออะไหล่ / รายการบริการ</label>
                <input type="text" placeholder="เช่น เปลี่ยนแคป, ค่าล้างแอร์ด่วน" class="item-name">
                <div class="item-grid">
                    <div>
                        <label>จำนวน</label>
                        <input type="number" value="1" min="1" class="item-qty" oninput="calculateTotal()">
                    </div>
                    <div>
                        <label>ราคา (บาท)</label>
                        <input type="number" value="0" min="0" step="0.01" class="item-price" oninput="calculateTotal()">
                    </div>
                </div>
            </div>
        `;
        
        calculateTotal();
        alert('✅ ล้างข้อมูลเรียบร้อยแล้ว');
    }
}

/**
 * ฟังก์ชันจัดรูปแบบวันที่เป็นภาษาไทย
 */
function formatThaiDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    
    return `${day} ${month} ${year}`;
}

/**
 * ฟังก์ชันป้องกัน XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * ปิด modal เมื่อคลิกนอกพื้นที่
 */
document.addEventListener('click', function(e) {
    const modal = document.getElementById('previewModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});
