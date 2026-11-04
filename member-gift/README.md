# MyTers 会员领取页

手机优先的静态 H5 页面。`index.html`、`style.css`、`app.js` 和 `assets/` 需保持相对路径。

## 当前测试流程

未配置接口时，页面使用本地模拟流程：输入 `13800138001` 并点击获取验证码可测试老用户提示；其他有效手机号点击获取验证码后自动填入 `123456`，同意协议后可打开领取成功弹窗。关闭弹窗会重置表单。此流程不发送短信、不查询真实注册状态，也不会创建账号或开通会员。

## 真实接口接入

在加载 `app.js` 前配置：

```html
<script>
window.MYTERS_API_CONFIG = {
  sendCodeUrl: '/api/member/send-code',
  claimUrl: '/api/member/claim'
};
</script>
```

两个接口使用 POST JSON。发送验证码接收 `{ "phone": "..." }`，领取接收 `{ "phone": "...", "code": "..." }`。成功返回 `{ "success": true }`；已注册号码返回 `{ "success": false, "code": "ALREADY_REGISTERED" }`；其他失败可返回 `{ "success": false, "message": "..." }`。服务端应负责验证码校验、注册状态判断和会员开通。只配置其中一个接口时不会切换到模拟流程。
