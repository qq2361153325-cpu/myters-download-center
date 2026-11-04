/*
 * Integration contract:
 * Set window.MYTERS_API_CONFIG before this script:
 *   { sendCodeUrl: '/api/member/send-code', claimUrl: '/api/member/claim' }
 * Both endpoints accept POST JSON. send-code receives { phone }; claim receives
 * { phone, code }. Success is { success: true }; an existing account is
 * { success: false, code: 'ALREADY_REGISTERED' }. Other failures may return
 * { success: false, message: '...' }. Never place secrets in this file.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const phone = $('phone');
  const code = $('code');
  const getCode = $('get-code');
  const claim = $('claim');
  const agree = $('agree');
  const phoneError = $('phone-error');
  const message = $('form-message');
  const successDialog = $('success-dialog');
  const existingDialog = $('existing-dialog');
  const copyName = $('copy-name');
  const copyFeedback = $('copy-feedback');
  const config = window.MYTERS_API_CONFIG || {};
  const validPhone = (value) => /^1[3-9]\d{9}$/.test(value);
  let registeredPhone = '';
  let phoneTouched = false;
  let busy = false;
  let seconds = 0;
  let timer;

  function setMessage(text = '') {
    message.textContent = text;
    message.hidden = !text;
  }

  function refresh() {
    const value = phone.value.trim();
    const registered = value !== '' && value === registeredPhone;
    const invalid = value !== '' && !validPhone(value);
    phoneError.textContent = registered
      ? '当前为已注册号码，不符合领取条件哦'
      : ((phoneTouched || value.length === 11) && invalid ? '请输入正确号码' : '');
    phoneError.hidden = !phoneError.textContent;
    phone.setAttribute('aria-invalid', String(!!phoneError.textContent));
    getCode.disabled = !validPhone(value) || registered || busy || seconds > 0;
    getCode.textContent = seconds > 0 ? `${seconds}s 后重新获取` : '获取验证码';
    claim.disabled = !validPhone(value) || registered || !code.value.trim() || !agree.checked || busy;
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function markRegistered(value) {
    registeredPhone = value;
    setMessage('');
    refresh();
    openDialog(existingDialog);
  }

  async function post(url, payload) {
    if (!url) throw new Error('服务暂未接入，请稍后再试');
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      throw new Error('网络开小差了，请稍后重试');
    }
    let result;
    try {
      result = await response.json();
    } catch (_) {
      throw new Error('服务暂时不可用，请稍后重试');
    }
    if (result.code === 'ALREADY_REGISTERED') return result;
    if (!response.ok || result.success !== true) {
      throw new Error(typeof result.message === 'string' && result.message ? result.message : '操作未完成，请稍后重试');
    }
    return result;
  }

  function startCountdown() {
    clearInterval(timer);
    seconds = 60;
    refresh();
    timer = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        seconds = 0;
        clearInterval(timer);
      }
      refresh();
    }, 1000);
  }

  phone.addEventListener('input', () => {
    phone.value = phone.value.replace(/\D/g, '').slice(0, 11);
    if (phone.value !== registeredPhone) registeredPhone = '';
    phoneTouched = false;
    setMessage('');
    refresh();
  });
  phone.addEventListener('blur', () => { phoneTouched = true; refresh(); });
  code.addEventListener('input', () => {
    code.value = code.value.replace(/\D/g, '').slice(0, 8);
    setMessage('');
    refresh();
  });
  agree.addEventListener('change', refresh);

  getCode.addEventListener('click', async () => {
    if (getCode.disabled) return;
    const value = phone.value.trim();
    busy = true;
    setMessage('');
    refresh();
    try {
      const result = await post(config.sendCodeUrl, { phone: value });
      if (phone.value.trim() !== value) return;
      if (result.code === 'ALREADY_REGISTERED') markRegistered(value);
      else {
        startCountdown();
        setMessage('验证码已发送，请注意查收');
      }
    } catch (error) {
      if (phone.value.trim() === value) setMessage(error.message);
    } finally {
      busy = false;
      refresh();
    }
  });

  async function submitClaim(event) {
    event.preventDefault();
    if (claim.disabled) return;
    const value = phone.value.trim();
    const verificationCode = code.value.trim();
    busy = true;
    setMessage('');
    refresh();
    try {
      const result = await post(config.claimUrl, { phone: value, code: verificationCode });
      if (result.code === 'ALREADY_REGISTERED') markRegistered(value);
      else openDialog(successDialog);
    } catch (error) {
      setMessage(error.message);
    } finally {
      busy = false;
      refresh();
    }
  }
  const form = claim.closest('form');
  if (form) form.addEventListener('submit', submitClaim);
  else claim.addEventListener('click', submitClaim);

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('dialog');
      if (dialog) closeDialog(dialog);
    });
  });
  [successDialog, existingDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  copyName.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText('MyTers');
      } else {
        const field = document.createElement('textarea');
        field.value = 'MyTers';
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('copy failed');
      }
      copyFeedback.textContent = '已复制 MyTers';
    } catch (_) {
      copyFeedback.textContent = '复制失败，请手动搜索 MyTers';
    }
  });
  refresh();
})();
