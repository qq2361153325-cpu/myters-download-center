# MyTers 会员领取页

手机优先的静态 H5 页面。`index.html`、`style.css`、`app.js` 和 `assets/` 需保持相对路径。

## 接口接入

在加载 `app.js` 前配置：

```html
<script>
window.MYTERS_API_CONFIG = {
  sendCodeUrl: '/api/member/send-code',
  claimUrl: '/api/member/claim'
};
</script>
```

两个接口使用 POST JSON。发送验证码接收 `{ "phone": "..." }`，领取接收 `{ "phone": "...", "code": "..." }`。成功返回 `{ "success": true }`；已注册号码返回 `{ "success": false, "code": "ALREADY_REGISTERED" }`；其他失败可返回 `{ "success": false, "message": "..." }`。服务端应负责验证码校验、注册状态判断和会员开通；未配置接口时页面不会模拟成功。

隐私条款当前指向 MyTers 官方个人信息保护规则；上线前请核对是否与登录页一致。
