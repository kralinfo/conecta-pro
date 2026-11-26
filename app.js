document.addEventListener('DOMContentLoaded', function () {
      try {
        // ---------------------------------------------------------
        // 1. CONFIGURAÇÃO E UTILITÁRIOS (MÓDULOS)
        // ---------------------------------------------------------
        const appNamespace = window.ConectaPro || {};
        const config = appNamespace.config || {};
        const utils = appNamespace.utils || {};

        const {
          DEFAULT_APPS_SCRIPT_URL,
          KEYS,
          DEFAULT_PROFESSIONS,
          INITIAL_CITIES,
          SAMPLE_PROFESSIONALS
        } = config;

        const {
          safeGetStorage,
          safeSetStorage,
          normalizeText,
          escapeHtml,
          onlyDigits,
          formatPhone
        } = utils;

        function showToast(message) {
          const toast = document.getElementById('toast-banner');
          if (!toast) return;
          toast.textContent = message;
          toast.classList.remove('hidden');
          clearTimeout(toast._timer);
          toast._timer = setTimeout(() => {
            toast.classList.add('hidden');
          }, 2600);
        }

        function showInlineError(el, message) {
          if (!el) return;
          if (message) {
            el.textContent = message;
            el.classList.remove('hidden');
          } else {
            el.classList.add('hidden');
          }
        }

        function copyTextFallback(text) {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
          } catch (_) {
            return false;
          }
        }

        // ---------------------------------------------------------
        // 3. ESTADO DO APLICATIVO
        // ---------------------------------------------------------
        let professionals = safeGetStorage(KEYS.PROFESSIONALS, SAMPLE_PROFESSIONALS);
        let professions = safeGetStorage(KEYS.PROFESSIONS, [...DEFAULT_PROFESSIONS]);
        let citiesList = Array.from(new Set([...INITIAL_CITIES, ...safeGetStorage(KEYS.CITIES_CACHE, [])]));
        let isSyncing = false;
        let lastUpdateRequestAt = 0;
        let supportsUpdateRequests = false;
        let registerFeature = null;

        function getActiveSheetsUrl() {
          return DEFAULT_APPS_SCRIPT_URL;
        }

        // ---------------------------------------------------------
        // 4. ELEMENTOS DO DOM
        // ---------------------------------------------------------
        const viewInicio = document.getElementById('view-inicio');
        const viewEncontrar = document.getElementById('view-encontrar');
        const viewCadastrar = document.getElementById('view-cadastrar');

        const btnLogoHome = document.getElementById('btn-logo-home');
        const btnHeaderInicio = document.getElementById('btn-header-inicio');
        const btnGoEncontrar = document.getElementById('btn-go-encontrar');
        const btnGoCadastrar = document.getElementById('btn-go-cadastrar');
        const backHomeButtons = document.querySelectorAll('[data-back-home]');

        // Busca
        const searchInput = document.getElementById('search-input');
        const btnClearSearch = document.getElementById('btn-clear-search');
        const searchHint = document.getElementById('search-hint');
        const cityTotalHint = document.getElementById('city-total-hint');
        const cityDetailSearchWrapper = document.getElementById('city-detail-search-wrapper');
        const cityDetailSearchInput = document.getElementById('city-detail-search-input');
        const searchSuggestions = document.getElementById('search-suggestions');
        const searchResultsWrapper = document.getElementById('search-results-wrapper');
        const resultsCount = document.getElementById('results-count');
        const resultsList = document.getElementById('results-list');
        const btnOpenUpdateRequest = document.getElementById('btn-open-update-request');

        // Cadastro
        const registerFormCard = document.getElementById('register-form-card');
        const registerSuccessCard = document.getElementById('register-success-card');
        const registerSyncNote = document.getElementById('register-sync-note');
        const formCadastro = document.getElementById('form-cadastro');
        const inputNome = document.getElementById('input-nome');
        const selectProfissao = document.getElementById('select-profissao');
        const btnToggleNewProf = document.getElementById('btn-toggle-new-prof');
        const newProfBox = document.getElementById('new-prof-box');
        const inputNewProf = document.getElementById('input-new-prof');
        const btnSaveNewProf = document.getElementById('btn-save-new-prof');
        const btnCancelNewProf = document.getElementById('btn-cancel-new-prof');
        const inputCidade = document.getElementById('input-cidade');
        const citySuggestions = document.getElementById('city-suggestions');
        const inputWhatsapp = document.getElementById('input-whatsapp');
        const checkAutorizo = document.getElementById('check-autorizo');
        const btnSubmitCadastro = document.getElementById('btn-submit-cadastro');
        const submitBtnText = document.getElementById('submit-btn-text');
        const btnSuccessSearch = document.getElementById('btn-success-search');
        const btnSuccessAnother = document.getElementById('btn-success-another');

        // Modal pedido de alteração
        const updateRequestModal = document.getElementById('update-request-modal');
        const btnCloseUpdateRequestModal = document.getElementById('btn-close-update-request-modal');
        const btnCancelUpdateRequest = document.getElementById('btn-cancel-update-request');
        const updateRequestForm = document.getElementById('update-request-form');
        const updateRequestProfessionalId = document.getElementById('update-request-professional-id');
        const updateRequestKind = document.getElementById('update-request-kind');
        const updateRequestProfessionalName = document.getElementById('update-request-professional-name');
        const updateRequestProfessionalPhone = document.getElementById('update-request-professional-phone');
        const updateRequestContactSearch = document.getElementById('update-request-contact-search');
        const updateRequestContactSuggestions = document.getElementById('update-request-contact-suggestions');
        const updateRequestSelectedProfessional = document.getElementById('update-request-selected-professional');
        const updateRequestSelectedName = document.getElementById('update-request-selected-name');
        const updateRequestSelectedPhone = document.getElementById('update-request-selected-phone');
        const updateRequestRequesterName = document.getElementById('update-request-requester-name');
        const updateRequestFieldGroup = document.getElementById('update-request-field-group');
        const updateRequestValueGroup = document.getElementById('update-request-value-group');
        const updateRequestField = document.getElementById('update-request-field');
        const updateRequestValue = document.getElementById('update-request-value');
        const updateRequestMessage = document.getElementById('update-request-message');
        const updateRequestContact = document.getElementById('update-request-contact');
        const updateRequestRemovalConsentGroup = document.getElementById('update-request-removal-consent-group');
        const updateRequestRemovalConsent = document.getElementById('update-request-removal-consent');
        const btnSendUpdateRequest = document.getElementById('btn-send-update-request');
        const errUpdateKind = document.getElementById('err-update-kind');
        const errUpdateProfessionalSelect = document.getElementById('err-update-professional-select');
        const errUpdateRequesterName = document.getElementById('err-update-requester-name');
        const errUpdateField = document.getElementById('err-update-field');
        const errUpdateValue = document.getElementById('err-update-value');
        const errUpdateMessage = document.getElementById('err-update-message');
        const errUpdateContact = document.getElementById('err-update-contact');
        const errUpdateRemovalConsent = document.getElementById('err-update-removal-consent');
        // ---------------------------------------------------------
        // 5. NAVEGAÇÃO ENTRE AS 3 TELAS
        // ---------------------------------------------------------
        function showView(viewName) {
          viewInicio.classList.add('hidden');
          viewEncontrar.classList.add('hidden');
          viewCadastrar.classList.add('hidden');

          if (viewName === 'encontrar') {
            viewEncontrar.classList.remove('hidden');
            viewEncontrar.classList.add('flex');
            btnHeaderInicio.classList.remove('hidden');
            btnHeaderInicio.classList.add('inline-flex');
            setTimeout(() => searchInput.focus(), 60);
          } else if (viewName === 'cadastrar') {
            viewCadastrar.classList.remove('hidden');
            viewCadastrar.classList.add('flex');
            btnHeaderInicio.classList.remove('hidden');
            btnHeaderInicio.classList.add('inline-flex');
            if (registerFeature && typeof registerFeature.resetCadastroFormState === 'function') {
              registerFeature.resetCadastroFormState();
            }
            setTimeout(() => inputNome.focus(), 60);
          } else {
            viewInicio.classList.remove('hidden');
            viewInicio.classList.add('flex');
            btnHeaderInicio.classList.add('hidden');
            btnHeaderInicio.classList.remove('inline-flex');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        btnLogoHome.addEventListener('click', () => showView('inicio'));
        btnHeaderInicio.addEventListener('click', () => showView('inicio'));
        btnGoEncontrar.addEventListener('click', () => showView('encontrar'));
        btnGoCadastrar.addEventListener('click', () => showView('cadastrar'));
        backHomeButtons.forEach((btn) => {
          btn.addEventListener('click', () => showView('inicio'));
        });

        // ---------------------------------------------------------
        // 6. INTEGRAÇÃO HÍBRIDA GOOGLE SHEETS (FETCH + JSONP / NO-CORS)
        // ---------------------------------------------------------
        function normalizeRecord(raw, index) {
          if (!raw || typeof raw !== 'object') return null;
          const nome = String(raw.nome || raw.Nome || '').trim();
          const profissao = String(raw.profissao || raw.Profissao || raw['Profissão'] || '').trim();
          const cidade = String(raw.cidade || raw.Cidade || '').trim();
          const whatsapp = onlyDigits(raw.whatsapp || raw.WhatsApp || raw.telefone || '');
          if (!nome && !profissao && !whatsapp) return null;
          return {
            id: String(raw.id || raw.ID || `sheet-${index + 1}`),
            nome,
            profissao,
            cidade,
            whatsapp
          };
        }

        function extractRecordsFromPayload(payload) {
          if (!payload) return null;
          let arr = null;
          if (Array.isArray(payload)) {
            arr = payload;
          } else if (typeof payload === 'object') {
            if (payload.ok === false || payload.status === 'error') return null;
            if (Array.isArray(payload.items)) arr = payload.items;
            else if (Array.isArray(payload.professionals)) arr = payload.professionals;
            else if (Array.isArray(payload.data)) arr = payload.data;
          }
          if (!arr) return null;
          return arr.map(normalizeRecord).filter(Boolean);
        }

        function extractSupportedActions(payload) {
          if (!payload || typeof payload !== 'object' || !Array.isArray(payload.supportedActions)) {
            return [];
          }
          return payload.supportedActions.map((action) => String(action || '').trim()).filter(Boolean);
        }

        function fetchViaJsonp(baseUrl, timeoutMs = 9500) {
          return new Promise((resolve, reject) => {
            const cbName = '__cp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
            const script = document.createElement('script');
            let done = false;

            const cleanup = () => {
              if (script.parentNode) script.parentNode.removeChild(script);
              try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
            };

            const timer = setTimeout(() => {
              if (done) return;
              done = true;
              cleanup();
              reject(new Error('Timeout JSONP'));
            }, timeoutMs);

            window[cbName] = function (data) {
              if (done) return;
              done = true;
              clearTimeout(timer);
              cleanup();
              resolve(data);
            };

            script.onerror = function () {
              if (done) return;
              done = true;
              clearTimeout(timer);
              cleanup();
              reject(new Error('Erro ao carregar JSONP'));
            };

            const sep = baseUrl.includes('?') ? '&' : '?';
            script.src = `${baseUrl}${sep}callback=${encodeURIComponent(cbName)}&t=${Date.now()}`;
            document.head.appendChild(script);
          });
        }

        async function readFromAppsScript(url) {
          const sep = url.includes('?') ? '&' : '?';
          const fullUrl = `${url}${sep}t=${Date.now()}`;

          try {
            const res = await fetch(fullUrl, { method: 'GET', redirect: 'follow' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            const parsed = extractRecordsFromPayload(json);
            const supportedActions = extractSupportedActions(json);
            if (parsed !== null) {
              return { records: parsed, via: 'fetch', supportedActions };
            }
            throw new Error('Formato de resposta inválido');
          } catch (fetchErr) {
            const jsonpPayload = await fetchViaJsonp(url, 9500);
            const parsedJsonp = extractRecordsFromPayload(jsonpPayload);
            const supportedActions = extractSupportedActions(jsonpPayload);
            if (parsedJsonp !== null) {
              return {
                records: parsedJsonp,
                via: 'jsonp',
                supportedActions
              };
            }
            throw fetchErr;
          }
        }

        async function syncFromSheets(silent = true) {
          const url = getActiveSheetsUrl();
          if (!url || isSyncing) return false;

          isSyncing = true;
          const refreshIcon = document.getElementById('refresh-icon');
          const refreshLabel = document.getElementById('refresh-label');
          if (refreshIcon) refreshIcon.classList.add('animate-spin');
          if (refreshLabel) refreshLabel.textContent = 'Sincronizando...';

          try {
            const { records, supportedActions } = await readFromAppsScript(url);
            supportsUpdateRequests = supportedActions.includes('request_update');
            if (records.length > 0) {
              professionals = records;
              safeSetStorage(KEYS.PROFESSIONALS, professionals);

              let updatedProfs = false;
              records.forEach((r) => {
                if (r.profissao && !professions.some((p) => normalizeText(p) === normalizeText(r.profissao))) {
                  professions.push(r.profissao);
                  updatedProfs = true;
                }
              });
              if (updatedProfs) {
                safeSetStorage(KEYS.PROFESSIONS, professions);
                if (registerFeature && typeof registerFeature.renderProfessionsSelect === 'function') {
                  registerFeature.renderProfessionsSelect(selectProfissao.value);
                }
              }
            }

            if (!viewEncontrar.classList.contains('hidden') && searchInput.value.trim() !== '') {
              renderSearchResults();
            }
            if (!silent) {
              showToast(`Lista atualizada com sucesso (${records.length} registro${records.length === 1 ? '' : 's'}).`);
            }
            return true;
          } catch (_) {
            if (!silent) {
              showToast('Não foi possível atualizar a lista agora. Tente novamente.');
            }
            return false;
          } finally {
            isSyncing = false;
            if (refreshIcon) refreshIcon.classList.remove('animate-spin');
            if (refreshLabel) refreshLabel.textContent = 'Atualizar lista';
          }
        }

        async function saveToSheets(record) {
          const url = getActiveSheetsUrl();
          if (!url) return { ok: false };

          const payloadStr = JSON.stringify({
            action: 'create_professional',
            id: record.id,
            nome: record.nome,
            profissao: record.profissao,
            cidade: record.cidade,
            whatsapp: record.whatsapp,
            autorizado: true
          });

          try {
            const res = await fetch(url, {
              method: 'POST',
              redirect: 'follow',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: payloadStr
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return { ok: true, mode: 'cors' };
          } catch (_) {
            try {
              await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: payloadStr
              });
              return { ok: true, mode: 'no-cors' };
            } catch (err) {
              return { ok: false, error: err };
            }
          }
        }

        async function saveUpdateRequestToSheets(requestData) {
          const url = getActiveSheetsUrl();
          if (!url) return { ok: false, reason: 'missing_url' };

          const payloadStr = JSON.stringify({
            action: 'request_update',
            pedidoId: String(Date.now()),
            profissionalId: String(requestData.profissionalId || '').trim(),
            tipoSolicitacao: String(requestData.tipoSolicitacao || 'alteracao').trim(),
            nomeAtual: String(requestData.nomeAtual || '').trim(),
            whatsappAtual: onlyDigits(requestData.whatsappAtual || ''),
            nomeSolicitante: String(requestData.nomeSolicitante || '').trim(),
            campoSolicitado: String(requestData.campoSolicitado || '').trim(),
            valorSugerido: String(requestData.valorSugerido || '').trim(),
            mensagem: String(requestData.mensagem || '').trim(),
            contatoSolicitante: onlyDigits(requestData.contatoSolicitante || ''),
            canal: 'app'
          });

          try {
            const res = await fetch(url, {
              method: 'POST',
              redirect: 'follow',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: payloadStr
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data && data.ok && data.acceptedAction === 'request_update') {
              return { ok: true, mode: 'cors', requestId: String(data.id || '') };
            }
            return { ok: false, reason: 'unsupported_action' };
          } catch (_) {
            return { ok: false };
          }
        }

        function resetUpdateRequestForm() {
          updateRequestForm.reset();
          updateRequestProfessionalId.value = '';
          updateRequestKind.value = 'alteracao';
          updateRequestProfessionalName.value = '';
          updateRequestProfessionalPhone.value = '';
          updateRequestContactSearch.value = '';
          updateRequestSelectedName.textContent = '-';
          updateRequestSelectedPhone.textContent = '-';
          updateRequestSelectedProfessional.classList.add('hidden');
          updateRequestContactSuggestions.classList.add('hidden');
          updateRequestRequesterName.value = '';
          updateRequestRemovalConsent.checked = false;
          showInlineError(errUpdateKind, '');
          showInlineError(errUpdateProfessionalSelect, '');
          showInlineError(errUpdateRequesterName, '');
          showInlineError(errUpdateField, '');
          showInlineError(errUpdateValue, '');
          showInlineError(errUpdateMessage, '');
          showInlineError(errUpdateContact, '');
          showInlineError(errUpdateRemovalConsent, '');
          updateRequestFieldGroup.classList.remove('hidden');
          updateRequestValueGroup.classList.remove('hidden');
          updateRequestRemovalConsentGroup.classList.add('hidden');
        }

        function updateRequestKindUI() {
          const isRemoval = updateRequestKind.value === 'remocao';
          if (isRemoval) {
            updateRequestFieldGroup.classList.add('hidden');
            updateRequestValueGroup.classList.add('hidden');
            updateRequestRemovalConsentGroup.classList.remove('hidden');
            updateRequestField.value = '';
            updateRequestValue.value = '';
            showInlineError(errUpdateField, '');
            showInlineError(errUpdateValue, '');
          } else {
            updateRequestFieldGroup.classList.remove('hidden');
            updateRequestValueGroup.classList.remove('hidden');
            updateRequestRemovalConsentGroup.classList.add('hidden');
            updateRequestRemovalConsent.checked = false;
            showInlineError(errUpdateRemovalConsent, '');
          }
        }

        function openUpdateRequestModal(pro = {}) {
          updateRequestProfessionalId.value = String(pro.id || '').trim();
          updateRequestKind.value = 'alteracao';
          updateRequestProfessionalName.value = pro.nome || '';
          updateRequestProfessionalPhone.value = onlyDigits(pro.whatsapp || '');
          updateRequestContactSearch.value = '';
          updateRequestSelectedName.textContent = updateRequestProfessionalName.value || '-';
          updateRequestSelectedPhone.textContent = formatPhone(updateRequestProfessionalPhone.value) || '-';
          if (updateRequestProfessionalId.value) {
            updateRequestSelectedProfessional.classList.remove('hidden');
          } else {
            updateRequestSelectedProfessional.classList.add('hidden');
          }
          updateRequestContactSuggestions.classList.add('hidden');
          updateRequestRequesterName.value = '';
          updateRequestField.value = '';
          updateRequestValue.value = '';
          updateRequestMessage.value = '';
          updateRequestContact.value = '';
          updateRequestRemovalConsent.checked = false;
          showInlineError(errUpdateKind, '');
          showInlineError(errUpdateProfessionalSelect, '');
          showInlineError(errUpdateRequesterName, '');
          showInlineError(errUpdateField, '');
          showInlineError(errUpdateValue, '');
          showInlineError(errUpdateMessage, '');
          showInlineError(errUpdateContact, '');
          showInlineError(errUpdateRemovalConsent, '');
          updateRequestKindUI();
          updateRequestModal.classList.remove('hidden');
          setTimeout(() => updateRequestContactSearch.focus(), 40);
        }

        function clearSelectedProfessional() {
          updateRequestProfessionalId.value = '';
          updateRequestProfessionalName.value = '';
          updateRequestProfessionalPhone.value = '';
          updateRequestSelectedName.textContent = '-';
          updateRequestSelectedPhone.textContent = '-';
          updateRequestSelectedProfessional.classList.add('hidden');
        }

        function selectProfessionalForUpdateRequest(professional) {
          if (!professional) return;
          updateRequestProfessionalId.value = String(professional.id || '').trim();
          updateRequestProfessionalName.value = String(professional.nome || '').trim();
          updateRequestProfessionalPhone.value = onlyDigits(professional.whatsapp || '');
          updateRequestSelectedName.textContent = updateRequestProfessionalName.value || '-';
          updateRequestSelectedPhone.textContent = formatPhone(updateRequestProfessionalPhone.value) || '-';
          updateRequestSelectedProfessional.classList.remove('hidden');
          updateRequestContactSearch.value = '';
          updateRequestContactSuggestions.classList.add('hidden');
          showInlineError(errUpdateProfessionalSelect, '');
        }

        function buildUpdateRequestContactSuggestions(query) {
          const normalizedQuery = normalizeText(query || '');
          if (!normalizedQuery || normalizedQuery.length < 2) {
            updateRequestContactSuggestions.classList.add('hidden');
            updateRequestContactSuggestions.innerHTML = '';
            return;
          }

          const candidates = professionals
            .filter((item) => {
              const phoneDigits = onlyDigits(item.whatsapp || '');
              const haystack = normalizeText(`${item.nome} ${item.profissao} ${item.cidade} ${phoneDigits}`);
              return haystack.includes(normalizedQuery);
            })
            .slice(0, 8);

          if (candidates.length === 0) {
            updateRequestContactSuggestions.classList.add('hidden');
            updateRequestContactSuggestions.innerHTML = '';
            return;
          }

          updateRequestContactSuggestions.innerHTML = candidates
            .map((item) => {
              const label = `${item.nome || '-'} • ${item.profissao || '-'} • ${item.cidade || '-'}`;
              const phone = formatPhone(item.whatsapp || '');
              return `
                <li>
                  <button
                    type="button"
                    data-update-contact-id="${escapeHtml(String(item.id || ''))}"
                    class="w-full px-4 py-3 text-left hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <p class="text-sm font-medium text-slate-800">${escapeHtml(label)}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(phone)}</p>
                  </button>
                </li>
              `;
            })
            .join('');
          updateRequestContactSuggestions.classList.remove('hidden');
        }

        function closeUpdateRequestModal() {
          updateRequestModal.classList.add('hidden');
          resetUpdateRequestForm();
        }

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !updateRequestModal.classList.contains('hidden')) {
            closeUpdateRequestModal();
          }
        });

        btnOpenUpdateRequest.addEventListener('click', () => {
          openUpdateRequestModal();
        });

        btnCloseUpdateRequestModal.addEventListener('click', closeUpdateRequestModal);
        btnCancelUpdateRequest.addEventListener('click', closeUpdateRequestModal);
        updateRequestModal.addEventListener('click', (e) => {
          if (e.target === updateRequestModal) closeUpdateRequestModal();
        });

        // ---------------------------------------------------------
        // 8. BUSCA UNIFICADA + AUTOCOMPLETE + CARDS DE RESULTADO
        // ---------------------------------------------------------
        function updateHintAndClearVisibility() {
          const hasText = searchInput.value.trim().length > 0;
          if (hasText) {
            searchHint.classList.add('opacity-0', 'pointer-events-none', 'h-0', 'mt-0', 'overflow-hidden');
            btnClearSearch.classList.remove('hidden');
          } else {
            searchHint.classList.remove('opacity-0', 'pointer-events-none', 'h-0', 'mt-0', 'overflow-hidden');
            btnClearSearch.classList.add('hidden');
          }
        }

        function buildSearchSuggestions(query) {
          const norm = normalizeText(query);
          if (norm.length < 1) {
            searchSuggestions.classList.add('hidden');
            return;
          }

          const suggestions = [];
          const seen = new Set();

          professions.forEach((p) => {
            if (normalizeText(p).includes(norm) && !seen.has('p:' + normalizeText(p))) {
              seen.add('p:' + normalizeText(p));
              suggestions.push({ label: p, type: 'Profissão' });
            }
          });

          citiesList.forEach((c) => {
            if (normalizeText(c).includes(norm) && !seen.has('c:' + normalizeText(c))) {
              seen.add('c:' + normalizeText(c));
              suggestions.push({ label: c, type: 'Cidade' });
            }
          });

          professionals.forEach((item) => {
            if (item.nome && normalizeText(item.nome).includes(norm) && !seen.has('n:' + normalizeText(item.nome))) {
              seen.add('n:' + normalizeText(item.nome));
              suggestions.push({ label: item.nome, type: item.profissao || 'Profissional' });
            }
          });

          const top = suggestions.slice(0, 7);
          if (top.length === 0) {
            searchSuggestions.classList.add('hidden');
            return;
          }

          searchSuggestions.innerHTML = top
            .map(
              (s) => `
              <li>
                <button
                  type="button"
                  data-suggestion-val="${escapeHtml(s.label)}"
                  class="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <span class="text-sm font-medium text-slate-800">${escapeHtml(s.label)}</span>
                  <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">${escapeHtml(s.type)}</span>
                </button>
              </li>
            `
            )
            .join('');

          searchSuggestions.classList.remove('hidden');
        }

        function renderSearchResults() {
          const rawQuery = searchInput.value.trim();
          updateHintAndClearVisibility();

          const cityMatch = citiesList.find((city) => normalizeText(city) === normalizeText(rawQuery));
          if (cityMatch) {
            const totalByCity = professionals.filter((item) => normalizeText(item.cidade) === normalizeText(cityMatch)).length;
            cityTotalHint.textContent = `${totalByCity} profissional${totalByCity === 1 ? '' : 'is'} em ${cityMatch}`;
            cityTotalHint.classList.remove('hidden');
            cityDetailSearchWrapper.classList.remove('hidden');
          } else {
            cityTotalHint.textContent = '';
            cityTotalHint.classList.add('hidden');
            cityDetailSearchWrapper.classList.add('hidden');
            cityDetailSearchInput.value = '';
          }

          if (!rawQuery) {
            searchResultsWrapper.classList.add('hidden');
            resultsList.innerHTML = '';
            return;
          }

          const terms = normalizeText(rawQuery).split(/\s+/).filter(Boolean);
          let filtered = professionals.filter((item) => {
            const haystack = normalizeText(`${item.nome} ${item.profissao} ${item.cidade}`);
            return terms.every((t) => haystack.includes(t));
          });

          if (cityMatch) {
            const cityProfessionals = professionals.filter(
              (item) => normalizeText(item.cidade) === normalizeText(cityMatch)
            );
            const detailTerms = normalizeText(cityDetailSearchInput.value.trim()).split(/\s+/).filter(Boolean);
            filtered = detailTerms.length
              ? cityProfessionals.filter((item) => {
                  const detailHaystack = normalizeText(`${item.nome} ${item.profissao}`);
                  return detailTerms.every((t) => detailHaystack.includes(t));
                })
              : cityProfessionals;
          }

          searchResultsWrapper.classList.remove('hidden');
          searchResultsWrapper.classList.add('flex');
          resultsCount.textContent =
            filtered.length === 0
              ? 'Nenhum resultado'
              : `${filtered.length} profissional${filtered.length === 1 ? '' : 'is'} encontrado${filtered.length === 1 ? '' : 's'}`;

          if (filtered.length === 0) {
            resultsList.innerHTML = `
              <div class="bg-white border border-slate-200 rounded-3xl p-8 text-center">
                <p class="text-slate-600 font-medium mb-1">Nenhum profissional encontrado para "${escapeHtml(rawQuery)}".</p>
                <p class="text-xs text-slate-400">Tente buscar por outra cidade, profissão ou nome.</p>
              </div>
            `;
            return;
          }

          resultsList.innerHTML = filtered
            .map((pro) => {
              const formattedPhone = formatPhone(pro.whatsapp);
              const waDigits = onlyDigits(pro.whatsapp);
              const waText = encodeURIComponent(
                `Olá ${pro.nome}! Encontrei seu contato como ${pro.profissao} no ConectaPro.`
              );
              const waUrl = `https://wa.me/55${waDigits}?text=${waText}`;

              return `
                <article class="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-3xl p-5 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="space-y-1.5">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="font-bold text-slate-900 text-base sm:text-lg leading-snug">${escapeHtml(pro.nome)}</h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        ${escapeHtml(pro.profissao)}
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
                      <span class="inline-flex items-center gap-1">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        ${escapeHtml(pro.cidade)}
                      </span>
                      <span class="inline-flex items-center gap-1 font-medium text-slate-600">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        ${escapeHtml(formattedPhone)}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <a
                      href="${waUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
                    >
                      Chamar no WhatsApp
                    </a>
                    <button
                      type="button"
                      data-copy-phone="${escapeHtml(waDigits)}"
                      class="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
                      title="Copiar número"
                    >
                      Copiar número
                    </button>
                  </div>
                </article>
              `;
            })
            .join('');
        }

        searchInput.addEventListener('input', () => {
          buildSearchSuggestions(searchInput.value);
          renderSearchResults();
        });

        cityDetailSearchInput.addEventListener('input', () => {
          renderSearchResults();
        });

        searchSuggestions.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-suggestion-val]');
          if (!btn) return;
          searchInput.value = btn.getAttribute('data-suggestion-val');
          searchSuggestions.classList.add('hidden');
          renderSearchResults();
        });

        btnClearSearch.addEventListener('click', () => {
          searchInput.value = '';
          searchSuggestions.classList.add('hidden');
          renderSearchResults();
          searchInput.focus();
        });

        resultsList.addEventListener('click', (e) => {
          const copyBtn = e.target.closest('[data-copy-phone]');
          if (!copyBtn) return;
          const phone = copyBtn.getAttribute('data-copy-phone');
          if (copyTextFallback(phone)) {
            showToast(`Número ${formatPhone(phone)} copiado!`);
          }
        });

        updateRequestContactSearch.addEventListener('input', () => {
          clearSelectedProfessional();
          buildUpdateRequestContactSuggestions(updateRequestContactSearch.value);
        });

        updateRequestContactSuggestions.addEventListener('click', (e) => {
          const button = e.target.closest('[data-update-contact-id]');
          if (!button) return;
          const selectedId = button.getAttribute('data-update-contact-id');
          const professional = professionals.find((item) => String(item.id || '') === String(selectedId || ''));
          if (!professional) return;
          selectProfessionalForUpdateRequest(professional);
        });

        updateRequestKind.addEventListener('change', updateRequestKindUI);

        updateRequestContact.addEventListener('input', () => {
          const digits = onlyDigits(updateRequestContact.value).slice(0, 11);
          if (updateRequestContact.value !== digits) {
            updateRequestContact.value = digits;
          }
        });
        updateRequestForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          if (!supportsUpdateRequests) {
            showToast('No momento, não é possível enviar pedidos de alteração ou remoção. Tente novamente mais tarde.');
            return;
          }

          const now = Date.now();
          if (now - lastUpdateRequestAt < 60000) {
            showToast('Aguarde 1 minuto antes de enviar um novo pedido.');
            return;
          }

          const profissionalId = updateRequestProfessionalId.value.trim();
          const tipoSolicitacao = updateRequestKind.value.trim();
          const nomeAtual = updateRequestProfessionalName.value.trim();
          const whatsappAtual = onlyDigits(updateRequestProfessionalPhone.value);
          const nomeSolicitante = updateRequestRequesterName.value.trim();
          const campoSolicitadoInput = updateRequestField.value.trim();
          const valorSugeridoInput = updateRequestValue.value.trim();
          const mensagem = updateRequestMessage.value.trim();
          const contatoSolicitante = onlyDigits(updateRequestContact.value);
          const removalConsentGiven = updateRequestRemovalConsent.checked;
          const isRemoval = tipoSolicitacao === 'remocao';
          const campoSolicitado = isRemoval ? 'remocao_cadastro' : campoSolicitadoInput;
          const valorSugerido = isRemoval ? '' : valorSugeridoInput;

          let valid = true;
          if (!tipoSolicitacao) {
            showInlineError(errUpdateKind, 'Selecione o tipo de solicitação.');
            valid = false;
          } else {
            showInlineError(errUpdateKind, '');
          }

          if (!profissionalId || nomeAtual.length < 2 || whatsappAtual.length < 10) {
            showInlineError(errUpdateProfessionalSelect, 'Pesquise e selecione um contato cadastrado.');
            valid = false;
          } else {
            showInlineError(errUpdateProfessionalSelect, '');
          }

          if (nomeSolicitante.length < 2) {
            showInlineError(errUpdateRequesterName, 'Informe seu nome para identificação.');
            valid = false;
          } else {
            showInlineError(errUpdateRequesterName, '');
          }

          if (isRemoval) {
            showInlineError(errUpdateField, '');
            showInlineError(errUpdateValue, '');
            if (!removalConsentGiven) {
              showInlineError(errUpdateRemovalConsent, 'Confirme a declaração para solicitar a remoção.');
              valid = false;
            } else {
              showInlineError(errUpdateRemovalConsent, '');
            }
          } else {
            showInlineError(errUpdateRemovalConsent, '');
            if (!campoSolicitado) {
              showInlineError(errUpdateField, 'Selecione o campo que precisa alterar.');
              valid = false;
            } else {
              showInlineError(errUpdateField, '');
            }

            if (valorSugerido.length < 2) {
              showInlineError(errUpdateValue, 'Informe o novo valor sugerido.');
              valid = false;
            } else {
              showInlineError(errUpdateValue, '');
            }
          }

          showInlineError(errUpdateMessage, '');

          if (contatoSolicitante.length < 10 || contatoSolicitante.length > 11) {
            showInlineError(errUpdateContact, 'Informe seu telefone com DDD (10 ou 11 dígitos).');
            valid = false;
          } else {
            showInlineError(errUpdateContact, '');
          }

          if (!valid) return;

          btnSendUpdateRequest.disabled = true;
          btnSendUpdateRequest.textContent = 'Enviando...';

          const result = await saveUpdateRequestToSheets({
            profissionalId,
            tipoSolicitacao,
            nomeAtual,
            whatsappAtual,
            nomeSolicitante,
            campoSolicitado,
            valorSugerido,
            mensagem,
            contatoSolicitante
          });

          btnSendUpdateRequest.disabled = false;
          btnSendUpdateRequest.textContent = 'Enviar pedido';

          if (result.ok) {
            lastUpdateRequestAt = Date.now();
            closeUpdateRequestModal();
            showToast('Pedido enviado com sucesso! Agora, aguarde a análise.');
          } else if (result.reason === 'unsupported_action') {
            showToast('No momento o envio de pedidos de alteração está indisponível.');
          } else {
            showToast('Não foi possível enviar o pedido agora. Tente novamente em instantes.');
          }
        });
        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.add('hidden');
          }
          if (!inputCidade.contains(e.target) && !citySuggestions.contains(e.target)) {
            citySuggestions.classList.add('hidden');
          }
          if (!updateRequestContactSearch.contains(e.target) && !updateRequestContactSuggestions.contains(e.target)) {
            updateRequestContactSuggestions.classList.add('hidden');
          }
        });

        // ---------------------------------------------------------
        // 9. CADASTRO: PROFISSÕES, AUTOCOMPLETE DE CIDADES E VALIDAÇÃO
        // ---------------------------------------------------------
        registerFeature = window.ConectaPro.features.createRegisterFeature({
          dom: {
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
          },
          state: {
            getProfessions: () => professions,
            getCitiesList: () => citiesList,
            getProfessionals: () => professionals
          },
          actions: {
            saveToSheets,
            syncFromSheets,
            showView,
            renderSearchResults
          },
          storage: {
            safeSetStorage,
            KEYS
          },
          format: {
            normalizeText,
            escapeHtml,
            onlyDigits
          },
          ui: {
            showToast
          }
        });

        registerFeature.init();

        // ---------------------------------------------------------
        // 10. CARREGAMENTO ASSÍNCRONO DE MUNICÍPIOS DO IBGE
        // ---------------------------------------------------------
        async function loadIbgeCities() {
          try {
            const cached = safeGetStorage(KEYS.CITIES_CACHE, []);
            if (Array.isArray(cached) && cached.length > 1000) return;

            const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data)) return;

            const formatted = data
              .map((m) => {
                const uf = m && m.microrregiao && m.microrregiao.mesorregiao && m.microrregiao.mesorregiao.UF
                  ? m.microrregiao.mesorregiao.UF.sigla
                  : '';
                return uf ? `${m.nome} - ${uf}` : m.nome;
              })
              .filter(Boolean);

            if (formatted.length > 0) {
              citiesList = Array.from(new Set([...INITIAL_CITIES, ...formatted]));
              safeSetStorage(KEYS.CITIES_CACHE, formatted);
            }
          } catch (_) {}
        }

        // ---------------------------------------------------------
        // 11. INICIALIZAÇÃO GERAL
        // ---------------------------------------------------------
        if (registerFeature && typeof registerFeature.renderProfessionsSelect === 'function') {
          registerFeature.renderProfessionsSelect();
        }
        showView('inicio');
        syncFromSheets(true);
        loadIbgeCities();
      } catch (fatalErr) {
        console.error('Erro ao inicializar ConectaPro:', fatalErr);
      }
    });