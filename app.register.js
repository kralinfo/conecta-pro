window.ConectaPro = window.ConectaPro || {};
window.ConectaPro.features = window.ConectaPro.features || {};

window.ConectaPro.features.createRegisterFeature = function createRegisterFeature(deps) {
  const {
    dom,
    state,
    actions,
    storage,
    format,
    ui
  } = deps;

  const {
    registerFormCard,
    registerSuccessCard,
    registerSyncNote,
    formCadastro,
    inputNome,
    selectProfissao,
    btnToggleNewProf,
    newProfBox,
    inputNewProf,
    btnSaveNewProf,
    btnCancelNewProf,
    inputCidade,
    citySuggestions,
    inputWhatsapp,
    checkAutorizo,
    btnSubmitCadastro,
    submitBtnText,
    btnSuccessSearch,
    btnSuccessAnother,
    searchInput,
    searchSuggestions
  } = dom;

  const { safeSetStorage, KEYS } = storage;
  const { normalizeText, escapeHtml, onlyDigits } = format;
  const { showToast } = ui;
  const { saveToSheets, syncFromSheets, showView, renderSearchResults } = actions;

  let lastRegisteredQuery = '';

  function renderProfessionsSelect(selectedValue = '') {
    const sorted = [...state.getProfessions()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    selectProfissao.innerHTML =
      `<option value="">Selecione sua profissão...</option>` +
      sorted
        .map(
          (profession) =>
            `<option value="${escapeHtml(profession)}" ${
              normalizeText(profession) === normalizeText(selectedValue) ? 'selected' : ''
            }>${escapeHtml(profession)}</option>`
        )
        .join('') +
      `<option value="__NEW__">+ Cadastrar nova profissão...</option>`;
  }

  function openNewProfessionBox() {
    newProfBox.classList.remove('hidden');
    inputNewProf.value = '';
    setTimeout(() => inputNewProf.focus(), 40);
  }

  function closeNewProfessionBox() {
    newProfBox.classList.add('hidden');
    if (selectProfissao.value === '__NEW__') {
      selectProfissao.value = '';
    }
  }

  function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function resetCadastroFormState() {
    formCadastro.reset();
    newProfBox.classList.add('hidden');
    citySuggestions.classList.add('hidden');
    ['err-nome', 'err-profissao', 'err-cidade', 'err-whatsapp', 'err-autorizo'].forEach((id) =>
      showFieldError(id, '')
    );
    registerFormCard.classList.remove('hidden');
    registerSuccessCard.classList.add('hidden');
  }

  function bindEvents() {
    selectProfissao.addEventListener('change', () => {
      if (selectProfissao.value === '__NEW__') {
        openNewProfessionBox();
      } else {
        newProfBox.classList.add('hidden');
      }
    });

    btnToggleNewProf.addEventListener('click', openNewProfessionBox);
    btnCancelNewProf.addEventListener('click', closeNewProfessionBox);

    btnSaveNewProf.addEventListener('click', () => {
      const raw = inputNewProf.value.trim();
      if (!raw) {
        inputNewProf.focus();
        return;
      }

      const professions = state.getProfessions();
      const formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
      const existing = professions.find((profession) => normalizeText(profession) === normalizeText(formatted));
      const finalName = existing || formatted;

      if (!existing) {
        professions.push(finalName);
        safeSetStorage(KEYS.PROFESSIONS, professions);
      }

      renderProfessionsSelect(finalName);
      newProfBox.classList.add('hidden');
      document.getElementById('err-profissao').classList.add('hidden');
      showToast(`Profissão "${finalName}" adicionada!`);
    });

    inputNewProf.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnSaveNewProf.click();
      }
    });

    inputCidade.addEventListener('input', () => {
      const norm = normalizeText(inputCidade.value);
      if (norm.length < 2) {
        citySuggestions.classList.add('hidden');
        return;
      }

      const matches = state
        .getCitiesList()
        .filter((city) => normalizeText(city).includes(norm))
        .slice(0, 8);

      if (matches.length === 0) {
        citySuggestions.classList.add('hidden');
        return;
      }

      citySuggestions.innerHTML = matches
        .map(
          (city) => `
          <li>
            <button
              type="button"
              data-city-choice="${escapeHtml(city)}"
              class="w-full px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-emerald-50 transition cursor-pointer"
            >
              ${escapeHtml(city)}
            </button>
          </li>
        `
        )
        .join('');
      citySuggestions.classList.remove('hidden');
    });

    citySuggestions.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-city-choice]');
      if (!btn) return;
      inputCidade.value = btn.getAttribute('data-city-choice');
      citySuggestions.classList.add('hidden');
      document.getElementById('err-cidade').classList.add('hidden');
    });

    inputWhatsapp.addEventListener('input', () => {
      const digits = onlyDigits(inputWhatsapp.value).slice(0, 11);
      if (inputWhatsapp.value !== digits) {
        inputWhatsapp.value = digits;
      }
    });

    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = inputNome.value.trim();
      const profissao = selectProfissao.value === '__NEW__' ? '' : selectProfissao.value.trim();
      const cidade = inputCidade.value.trim();
      const whatsapp = onlyDigits(inputWhatsapp.value);
      const autorizado = checkAutorizo.checked;

      let valid = true;

      if (nome.length < 2) {
        showFieldError('err-nome', 'Informe seu nome.');
        valid = false;
      } else {
        showFieldError('err-nome', '');
      }

      if (!profissao) {
        showFieldError('err-profissao', 'Selecione ou adicione sua profissão.');
        valid = false;
      } else {
        showFieldError('err-profissao', '');
      }

      if (cidade.length < 2) {
        showFieldError('err-cidade', 'Informe sua cidade.');
        valid = false;
      } else {
        showFieldError('err-cidade', '');
      }

      if (whatsapp.length < 10 || whatsapp.length > 11) {
        showFieldError('err-whatsapp', 'Digite o WhatsApp com DDD usando 10 ou 11 números (ex.: 11999998888).');
        valid = false;
      } else {
        showFieldError('err-whatsapp', '');
      }

      if (!autorizado) {
        showFieldError('err-autorizo', 'Você precisa marcar a autorização para divulgar seu contato.');
        valid = false;
      } else {
        showFieldError('err-autorizo', '');
      }

      if (!valid) return;

      btnSubmitCadastro.disabled = true;
      submitBtnText.textContent = 'Salvando na planilha...';

      const newRecord = {
        id: String(Date.now()),
        nome,
        profissao,
        cidade,
        whatsapp
      };

      const professionals = state.getProfessionals();
      professionals.unshift(newRecord);
      safeSetStorage(KEYS.PROFESSIONALS, professionals);

      const sheetResult = await saveToSheets(newRecord);

      btnSubmitCadastro.disabled = false;
      submitBtnText.textContent = 'Salvar Cadastro';

      lastRegisteredQuery = profissao;
      registerSyncNote.textContent = sheetResult.ok
        ? 'Seu perfil foi enviado para a planilha do Google Sheets e já aparece nas buscas!'
        : 'Seu perfil foi salvo localmente neste dispositivo.';

      registerFormCard.classList.add('hidden');
      registerSuccessCard.classList.remove('hidden');

      if (sheetResult.ok) {
        setTimeout(() => syncFromSheets(true), 1200);
      }
    });

    btnSuccessSearch.addEventListener('click', () => {
      showView('encontrar');
      searchInput.value = lastRegisteredQuery;
      searchSuggestions.classList.add('hidden');
      renderSearchResults();
    });

    btnSuccessAnother.addEventListener('click', () => {
      resetCadastroFormState();
      inputNome.focus();
    });
  }

  return {
    renderProfessionsSelect,
    resetCadastroFormState,
    init: bindEvents
  };
};
