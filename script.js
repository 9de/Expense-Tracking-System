
// تعريف المتغيرات العامة
let expenses = [];
let filteredExpenses = [];
let monthlySalary = 0;
let categoryChart = null;

// التحقق من وضع السمة (فاتح/داكن)
function checkTheme() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').textContent = '☀️';
        document.getElementById('themeText').textContent = 'الوضع الفاتح';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeIcon').textContent = '🌙';
        document.getElementById('themeText').textContent = 'الوضع الداكن';
    }
}

// تبديل وضع السمة
document.getElementById('themeToggle').addEventListener('click', function() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
    if (darkModeEnabled) {
        localStorage.setItem('darkMode', 'disabled');
    } else {
        localStorage.setItem('darkMode', 'enabled');
    }
    checkTheme();
    updateCategoryChart(); // تحديث ألوان الرسم البياني
});

// الحصول على التاريخ الحالي
document.getElementById('date').valueAsDate = new Date();

// إضافة مصروف جديد
document.getElementById('addExpense').addEventListener('click', function() {
    const category = document.getElementById('category').value;
    const merchant = document.getElementById('merchant').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const notes = document.getElementById('notes').value;
    
    // التحقق من صحة البيانات
    if (!category || !merchant || isNaN(amount) || amount <= 0 || !date) {
        alert('الرجاء إدخال جميع البيانات المطلوبة بشكل صحيح');
        return;
    }
    
    // إضافة المصروف الجديد إلى المصفوفة
    const expense = {
        category,
        merchant,
        amount,
        date,
        notes
    };
    
    expenses.push(expense);
    
    // حفظ البيانات في التخزين المحلي
    saveExpenses();
    
    // إعادة تعيين النموذج
    document.getElementById('merchant').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('notes').value = '';
    
    // تحديث العرض
    displayExpenses(expenses);
    updateFinancialSummary();
    updateStatistics();
    updateCategoryChart();
    
    alert('تمت إضافة المصروف بنجاح!');
});

// عرض المصاريف في الجدول
function displayExpenses(expensesToShow) {
    const tableBody = document.getElementById('expensesList');
    tableBody.innerHTML = '';
    
    expensesToShow.forEach(expense => {
        const row = document.createElement('tr');
        
        // تنسيق التاريخ
        const formattedDate = new Date(expense.date).toLocaleDateString('ar-SA');
        
        row.innerHTML = `
            <td>${expense.category}</td>
            <td>${expense.merchant}</td>
            <td>${expense.amount.toFixed(2)}</td>
            <td>${formattedDate}</td>
            <td>${expense.notes || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // في حالة عدم وجود مصاريف
    if (expensesToShow.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" style="text-align: center;">لا توجد مصاريف لعرضها</td>';
        tableBody.appendChild(emptyRow);
    }
}

// تحديث الملخص المالي
function updateFinancialSummary() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = monthlySalary - total;
    const spendingPercentage = monthlySalary > 0 ? (total / monthlySalary) * 100 : 0;
    
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    document.getElementById('remainingAmount').textContent = remaining.toFixed(2);
    
    // تحديث شريط التقدم
    const progressBar = document.getElementById('spendingProgress');
    const progressText = document.getElementById('spendingPercentage');
    
    // التأكد من أن النسبة المئوية لا تتجاوز 100٪
    const cappedPercentage = Math.min(spendingPercentage, 100);
    progressBar.style.width = `${cappedPercentage}%`;
    progressText.textContent = `${cappedPercentage.toFixed(1)}%`;
    
    // تغيير لون شريط التقدم بناءً على النسبة
    if (spendingPercentage < 50) {
        progressBar.style.backgroundColor = '#27ae60'; // أخضر
    } else if (spendingPercentage < 80) {
        progressBar.style.backgroundColor = '#f39c12'; // برتقالي
    } else {
        progressBar.style.backgroundColor = '#e74c3c'; // أحمر
    }
}

// تحديث الإحصائيات
function updateStatistics() {
    if (expenses.length === 0) {
        document.getElementById('expenseCount').textContent = '0';
        document.getElementById('averageExpense').textContent = '0';
        document.getElementById('highestExpense').textContent = '0';
        return;
    }
    
    const count = expenses.length;
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const average = total / count;
    const highest = Math.max(...expenses.map(e => e.amount));
    
    document.getElementById('expenseCount').textContent = count;
    document.getElementById('averageExpense').textContent = average.toFixed(2);
    document.getElementById('highestExpense').textContent = highest.toFixed(2);
}

// تحديث الرسم البياني للتصنيفات
function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // تجميع المصاريف حسب التصنيف
    const categoryData = {};
    expenses.forEach(expense => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += expense.amount;
    });
    
    // تحويل البيانات إلى صيغة مناسبة للرسم البياني
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    // تحديد الألوان بناءً على وضع السمة
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e8eaed' : '#333';
    
    // إنشاء الرسم البياني
    if (categoryChart) {
        categoryChart.destroy(); // إزالة الرسم البياني القديم إذا كان موجودًا
    }
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
                    '#9b59b6', '#1abc9c', '#d35400', '#34495e'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toFixed(2)} ريال (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// حفظ المصاريف في التخزين المحلي
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// حفظ الراتب في التخزين المحلي
function saveSalary() {
    localStorage.setItem('monthlySalary', monthlySalary.toString());
}

// تحميل البيانات من التخزين المحلي
function loadData() {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
    
    const savedSalary = localStorage.getItem('monthlySalary');
    if (savedSalary) {
        monthlySalary = parseFloat(savedSalary);
        document.getElementById('salary').value = monthlySalary;
        document.getElementById('monthlySalary').textContent = monthlySalary.toFixed(2);
    }
    
    displayExpenses(expenses);
    updateFinancialSummary();
    updateStatistics();
    updateCategoryChart();
}

// حفظ الراتب
document.getElementById('setSalary').addEventListener('click', function() {
    const salaryInput = parseFloat(document.getElementById('salary').value);
    
    if (isNaN(salaryInput) || salaryInput < 0) {
        alert('الرجاء إدخال راتب صحيح');
        return;
    }
    
    monthlySalary = salaryInput;
    document.getElementById('monthlySalary').textContent = monthlySalary.toFixed(2);
    
    // حفظ الراتب
    saveSalary();
    
    // تحديث الملخص المالي
    updateFinancialSummary();
    
    alert('تم حفظ الراتب بنجاح!');
});

// البحث عن المصاريف
document.getElementById('searchExpenses').addEventListener('click', function() {
    const categoryFilter = document.getElementById('searchCategory').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // تطبيق المرشحات
    filteredExpenses = expenses.filter(expense => {
        let matchesCategory = true;
        let matchesDateRange = true;
        
        // فلترة حسب التصنيف
        if (categoryFilter && expense.category !== categoryFilter) {
            matchesCategory = false;
        }
        
        // فلترة حسب نطاق التاريخ
        if (startDate && expense.date < startDate) {
            matchesDateRange = false;
        }
        
        if (endDate && expense.date > endDate) {
            matchesDateRange = false;
        }
        
        return matchesCategory && matchesDateRange;
    });
    
    displayExpenses(filteredExpenses);
    
    // حساب المجموع للنتائج المفلترة
    const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('totalAmount').textContent = filteredTotal.toFixed(2);
    document.getElementById('remainingAmount').textContent = (monthlySalary - filteredTotal).toFixed(2);
    
    // تحديث شريط التقدم
    const spendingPercentage = monthlySalary > 0 ? (filteredTotal / monthlySalary) * 100 : 0;
    const cappedPercentage = Math.min(spendingPercentage, 100);
    document.getElementById('spendingProgress').style.width = `${cappedPercentage}%`;
    document.getElementById('spendingPercentage').textContent = `${cappedPercentage.toFixed(1)}%`;
});

// إعادة ضبط البحث
document.getElementById('resetSearch').addEventListener('click', function() {
    document.getElementById('searchCategory').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    displayExpenses(expenses);
    updateFinancialSummary();
});

// تصدير البيانات إلى Excel
document.getElementById('exportExcel').addEventListener('click', function() {
    // تحديد البيانات المراد تصديرها (إما المفلترة أو الكاملة)
    const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    
    if (dataToExport.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }
    
    // تحويل البيانات إلى تنسيق مناسب لـ Excel
    const worksheetData = [
        ['التصنيف', 'اسم التاجر', 'المبلغ (ريال)', 'التاريخ', 'ملاحظات']
    ];
    
    dataToExport.forEach(expense => {
        worksheetData.push([
            expense.category,
            expense.merchant,
            expense.amount,
            expense.date,
            expense.notes || ''
        ]);
    });
    
    // حساب التفاصيل المالية
    const total = dataToExport.reduce((sum, expense) => sum + expense.amount, 0);
    
    // إضافة ملخص مالي
    worksheetData.push(['', '', '', '', '']);
    worksheetData.push(['ملخص مالي', '', '', '', '']);
    worksheetData.push(['الراتب الشهري', '', monthlySalary, '', '']);
    worksheetData.push(['إجمالي المصروفات', '', total.toFixed(2), '', '']);
    worksheetData.push(['المتبقي', '', (monthlySalary - total).toFixed(2), '', '']);
    worksheetData.push(['نسبة الصرف', '', ((total / monthlySalary) * 100).toFixed(1) + '%', '', '']);
    
    // إضافة توزيع المصاريف حسب التصنيف
    worksheetData.push(['', '', '', '', '']);
    worksheetData.push(['توزيع المصاريف حسب التصنيف', '', '', '', '']);
    
// تجميع المصاريف حسب التصنيف
const categoryData = {};
    dataToExport.forEach(expense => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += expense.amount;
    });
    
    // إضافة بيانات التصنيف إلى ملف Excel
    for (const category in categoryData) {
        const amount = categoryData[category];
        const percentage = ((amount / total) * 100).toFixed(1) + '%';
        worksheetData.push([category, '', amount.toFixed(2), percentage, '']);
    }
    
    // إنشاء ورقة عمل Excel
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // تطبيق تنسيق الخلايا
    const cellStyle = { 
        alignment: { 
            horizontal: 'right',
            vertical: 'center'
        } 
    };
    
    // تطبيق التنسيق على نطاق الخلايا
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = cellStyle;
        }
    }
    
    // إنشاء مصنف Excel
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مصاريفي');
    
    // حفظ الملف
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `مصاريفي_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
});

// تحميل البيانات عند تحميل الصفحة
window.addEventListener('load', function() {
    checkTheme();
    loadData();
});
