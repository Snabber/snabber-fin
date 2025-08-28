<?php
// index.php - coloque no public_html
// Redireciona para o site hospedado no Vercel

$target = 'https://snabber-fin.vercel.app/';

// Evita qualquer output antes dos headers
if (!headers_sent()) {
    // 302 Found (temporário). Troque para 301 se quiser permanente:
    header('HTTP/1.1 302 Found');
    header('Location: ' . $target);
    exit;
}

// Fallback HTML (caso headers já tenham sido enviados)
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=<?php echo htmlspecialchars($target, ENT_QUOTES, 'UTF-8'); ?>">
  <title>Redirecionando…</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f6f7fb; color:#111; }
    .box { text-align:center; padding:24px; border-radius:8px; box-shadow:0 6px 18px rgba(23,23,23,0.08); background:white; }
    a { color:#0066cc; text-decoration:none; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Redirecionando...</h1>
    <p>Se você não for redirecionado automaticamente, <a href="<?php echo htmlspecialchars($target, ENT_QUOTES, 'UTF-8'); ?>">clique aqui</a>.</p>
  </div>
</body>
</html>
