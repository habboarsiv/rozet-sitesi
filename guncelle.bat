@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem Sahip sayıları hangi otellerde sorulsun? Boş bırakırsanız hepsi sorulur (çok uzun sürer).
rem Örnekler:   tr      tr,com      (boş)
set SAHIP_OTELLER=tr

set PY=python
where py >nul 2>nul && set PY=py
set EK=
if not "%SAHIP_OTELLER%"=="" set EK=--oteller %SAHIP_OTELLER%
if /i "%1"=="otomatik" set EK=%EK% --dakika 30

echo === 1/3: Rozet listesi ===
%PY% rozetleri_cek.py
echo.
echo === 2/3: Promo gorselleri ===
%PY% promolari_cek.py
echo.
echo === 3/3: Rozet sahip sayilari ===
%PY% sahipleri_cek.py %EK%
rem Elle çift tıklayınca pencere kapanmasın; zamanlanmış görevde "otomatik" parametresi verilir.
if /i not "%1"=="otomatik" pause
