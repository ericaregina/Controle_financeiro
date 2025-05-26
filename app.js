let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];

const form = document.getElementById('form-transacao');
const lista = document.getElementById('lista-transacoes');
const saldoEl = document.getElementById('saldo');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const descricao = document.getElementById('descricao').value;
  const valor = parseFloat(document.getElementById('valor').value);
  const tipo = document.getElementById('tipo').value;
  const categoria = document.getElementById('categoria').value;
  const data = document.getElementById('data').value;

  const transacao = { id: Date.now(), descricao, valor, tipo, categoria, data };

  transacoes.push(transacao);
  salvarTransacoes();
  atualizarUI();
  form.reset();
});

function salvarTransacoes() {
  localStorage.setItem('transacoes', JSON.stringify(transacoes));
}

function atualizarUI() {
  lista.innerHTML = '';

  let saldo = 0;

  transacoes.forEach(transacao => {
    const li = document.createElement('li');
    li.className = "bg-white p-4 rounded-xl shadow flex justify-between items-center";

    const sinal = transacao.tipo === 'entrada' ? '+' : '-';
    li.innerHTML = `
      <span>${transacao.descricao} (${transacao.categoria})</span>
      <span class="${transacao.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}">${sinal} R$ ${transacao.valor.toFixed(2)}</span>
    `;

    lista.appendChild(li);

    saldo += transacao.tipo === 'entrada' ? transacao.valor : -transacao.valor;
  });

  saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;

  atualizarGrafico();
}

let grafico;

function atualizarGrafico() {
  const categorias = {};
  
  transacoes.forEach(t => {
    if(t.tipo === 'saida') {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    }
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);

  if(grafico) {
    grafico.destroy();
  }

  const ctx = document.getElementById('grafico').getContext('2d');
  grafico = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gastos por Categoria',
        data: data,
        backgroundColor: ['#fbb6ce', '#fcd5ce', '#c7d2fe', '#fde68a', '#a7f3d0']
      }]
    }
  });
}

atualizarUI();

//  CSV
document.getElementById('exportarCSV').addEventListener('click', function() {
  const linhas = ['Descrição,Valor,Tipo,Categoria,Data'];
  
  transacoes.forEach(t => {
    linhas.push(`${t.descricao},${t.valor},${t.tipo},${t.categoria},${t.data}`);
  });
  
  const csv = linhas.join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'transacoes.csv');
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
});

//  PDF
document.getElementById('exportarPDF').addEventListener('click', function() {
  const graficoCanvas = document.getElementById('grafico');

  html2canvas(graficoCanvas).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.addImage(imgData, 'PNG', 10, 10, 180, 100);
    pdf.save('grafico-financeiro.pdf');
  });
});

//  Excel
document.getElementById('exportarExcel').addEventListener('click', function() {
  const ws_data = [['Descrição', 'Valor', 'Tipo', 'Categoria', 'Data']];
  
  transacoes.forEach(t => {
    ws_data.push([t.descricao, t.valor, t.tipo, t.categoria, t.data]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');

  XLSX.writeFile(wb, 'transacoes.xlsx');
});
