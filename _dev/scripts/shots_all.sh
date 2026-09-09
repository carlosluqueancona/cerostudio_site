#!/bin/zsh
SP=$(cd "$(dirname "$0")" && pwd)
OUT=$1
/usr/bin/python3 $SP/shot.py $OUT /servicios/desarrollo-web/ srv-web 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /servicios/tiendas-ecommerce/ srv-tiendas 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /servicios/seo/ srv-seo 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /nosotros/ nosotros 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /casos-de-exito/ casos 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /casos-de-exito/imvec/ caso-imvec 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /auditoria-gratis/ auditoria 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /recursos/ recursos 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /en/ home-en 2>&1 | tail -1
/usr/bin/python3 $SP/shot.py $OUT /en/services/web-development/ srv-web-en 2>&1 | tail -1
