const form = document.getElementById('study-form');
const subjectInput = document.getElementById('subject');
const dateInput = document.getElementById('date');
const colorInput = document.getElementById('color');
const modal = document.getElementById('modal');
const tasksContainer = document.getElementById('tasks-container');
const themeToggle = document.getElementById('toggle-theme');

let feriados = [];
let tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];
let indexEditando = null;

// Função para carregar os feriados de um ano específico
const loadFeriados = async (ano) => {
    // Verifica se os feriados para o ano estão armazenados no localStorage
    let feriados = JSON.parse(localStorage.getItem(`feriados-${ano}`));

    if (feriados) {
        return feriados;  // Retorna os feriados já carregados
    }

    // Se não estiver no cache, faz a requisição à API
    try {
        const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
        feriados = await res.json();
        localStorage.setItem(`feriados-${ano}`, JSON.stringify(feriados));  // Armazena no cache
        return feriados;
    } catch (err) {
        console.error('Erro ao carregar feriados:', err);
        return [];
    }
};

// Função para formatar a data para comparação
const formatarData = (data) => {
    const [ano, mes, dia] = data.split('-');
    return new Date(ano, mes - 1, dia).toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

// Função para exibir as tarefas
const exibirTarefas = async () => {
    // tarefas.reverse();
    // tarefas.sort((a, b) => new Date(a.data) - new Date(b.data));
    tasksContainer.innerHTML = '';

    if (tarefas.length === 0) {
        tasksContainer.innerHTML = '<div class="empty-state">Nenhuma tarefa adicionada. Clique em "Nova Tarefa" para começar.</div>';
        return;
    }

    // Para cada tarefa, verificar se é um feriado
    for (let [index, tarefa] of tarefas.entries()) {
        const [ano, mes, dia] = tarefa.data.split('-');
        const anoTarefa = parseInt(ano);  // Pega o ano da tarefa

        // Carrega os feriados para o ano da tarefa (pode estar no cache)
        const feriados = await loadFeriados(anoTarefa);

        const dataTarefaFormatada = formatarData(tarefa.data);
        const feriado = feriados.find(f => formatarData(f.date) === dataTarefaFormatada);

        const template = document.getElementById('task-template');
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.task-card');
        const colorIndicator = clone.querySelector('.task-color-indicator');
        colorIndicator.style.backgroundColor = tarefa.cor;

        clone.querySelector('.task-subject').textContent = tarefa.materia;
        const data = new Date(ano, mes - 1, dia);
        clone.querySelector('.task-date').textContent = data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });

        // Se for feriado, exibe o alerta
        if (feriado) {
            const holidayEl = clone.querySelector('.task-holiday');
            holidayEl.textContent = `${feriado.name}`;
            holidayEl.classList.add('holiday-alert');
        } else {
            const holidayEl = clone.querySelector('.task-holiday');
            holidayEl.textContent = '';
            holidayEl.classList.remove('holiday-alert');
        }

        // Adicionando os eventos para editar e excluir a tarefa
        clone.querySelector('.edit-task').addEventListener('click', () => editarTarefa(index));
        clone.querySelector('.delete-task').addEventListener('click', () => excluirTarefa(index));

        tasksContainer.appendChild(clone);
    }
};

// Função para editar tarefa
const editarTarefa = (index) => {
    const tarefa = tarefas[index];
    subjectInput.value = tarefa.materia;
    dateInput.value = tarefa.data;
    colorInput.value = tarefa.cor;
    indexEditando = index;
    abrirModal();
};

// Função para excluir tarefa
const excluirTarefa = (index) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        tarefas.splice(index, 1);
        salvarTarefas();
        exibirTarefas();
    }
};

// Função para salvar tarefas no localStorage
const salvarTarefas = () => {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
};

// Função para abrir o modal
const abrirModal = () => {
    modal.classList.add('open');
    document.body.classList.add('modal-open');
};

// Função para fechar o modal
const fecharModal = () => {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    form.reset();
    indexEditando = null;
};

// Ao clicar fora do modal, fecha o modal
window.onclick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) fecharModal();
};

// Função para aplicar o tema
const aplicarTema = (tema) => {
    document.body.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
};

// Alternar tema claro e escuro
themeToggle.addEventListener('click', () => {
    const temaAtual = document.body.getAttribute('data-theme') || 'claro';
    aplicarTema(temaAtual === 'claro' ? 'escuro' : 'claro');
});

// Evento para submeter o formulário e salvar a tarefa
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaTarefa = {
        materia: subjectInput.value,
        data: dateInput.value,
        cor: colorInput.value
    };

    // Adiciona ou edita a tarefa na lista
    if (indexEditando !== null) {
        tarefas[indexEditando] = novaTarefa;
        indexEditando = null;
    } else {
        tarefas.push(novaTarefa);
    }

    salvarTarefas();
    await exibirTarefas();
    fecharModal();
});

// Carregar o tema salvo e as tarefas ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const temaSalvo = localStorage.getItem('tema') || 'claro';
    aplicarTema(temaSalvo);
    exibirTarefas();
});