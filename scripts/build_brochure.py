from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor,white
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
root=Path.cwd(); out=root/'public/documents/Shattyq-presentation.pdf'
pdfmetrics.registerFont(TTFont('Open',str(root/'public/sensata/OpenSans.ttf')))
pdfmetrics.registerFont(TTFont('Semi',str(root/'public/sensata/OpenSans-Semibold.ttf')))
W,H=A4; blue=HexColor('#222288'); gray=HexColor('#797987'); c=canvas.Canvas(str(out),pagesize=A4)
c.setTitle('Shattyq - презентация проекта'); c.setAuthor('Презентация по материалам Sensata Group')
def text(x,y,s,size=12,color=blue,font='Open'):
 c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,s)
def photo(name,x,y,w,h):
 img=ImageReader(str(root/'public/sensata'/name));iw,ih=img.getSize();scale=max(w/iw,h/ih)
 c.saveState();p=c.beginPath();p.rect(x,y,w,h);c.clipPath(p,stroke=0,fill=0);c.drawImage(img,x+(w-iw*scale)/2,y+(h-ih*scale)/2,iw*scale,ih*scale,mask='auto');c.restoreState()
def footer(n):
 c.setStrokeColor(HexColor('#dddded'));c.line(40,45,W-40,45);text(40,28,'SHATTYQ / SENSATA GROUP',8,gray);text(W-55,28,str(n),8,gray)
def logo(): c.drawImage(str(root/'public/sensata/logo.png'),40,H-83,160,42,mask='auto',preserveAspectRatio=True)
# Cover
photo('hero.jpg',0,250,W,H-250);c.setFillColor(blue);c.rect(0,0,W,250,fill=1,stroke=0)
c.drawImage(str(root/'public/sensata/logo-white.png'),40,H-85,150,42,mask='auto',preserveAspectRatio=True)
text(40,200,'SHATTYQ',55,white);text(42,158,'Счастье быть дома',23,white)
text(42,107,'Премиум-класс. Астана, район Есиль.',12,white)
text(42,82,'Пересечение Ә. Бөкейхана и Орынбор',12,white)
text(42,36,'Презентация по открытым материалам Sensata • 16.09.2026',8,white)
c.showPage()
logo();text(40,H-135,'Пространство вашей жизни',29)
photo('courtyard-1.jpg',40,360,W-80,300)
text(40,318,'9 этажей',28);text(285,318,'3-4 квартиры на этаже',19)
lines=['Монолитный каркас и свободные планировки.','Закрытый двор без автомобилей.','Озеленение, прогулочные дорожки и места отдыха.','Сквозные подъезды, Face ID, видеонаблюдение 24/7.']
for i,line in enumerate(lines):text(40,265-i*33,line,12,gray)
text(40,100,'Изображения - проектные визуализации, не фотографии строительства.',9,gray)
footer(2);c.showPage()
logo();text(40,H-135,'Выберите свою планировку',29)
for i,(name,title) in enumerate([('plan-1.jpg','2-комнатная'),('plan-6.jpg','3-комнатная'),('plan-18.jpg','4-комнатная')]):
 x=40+i*174;c.drawImage(str(root/'public/sensata'/name),x,350,165,240,preserveAspectRatio=True,anchor='c');text(x,325,title,13)
text(40,280,'20 оригинальных чертежей в каталоге сайта.',14)
text(40,245,'5 двухкомнатных • 12 трёхкомнатных • 3 четырёхкомнатных',11,gray)
for i,line in enumerate(['Планировки опубликованы на официальной странице Shattyq.','Этаж и секция указаны на каждом оригинальном чертеже.','Стоимость и наличие уточняются в отделе продаж.','Публикация плана не подтверждает доступность квартиры.']):text(40,192-i*25,line,10,gray)
footer(3);c.showPage()
logo();text(40,H-135,'Давайте познакомимся',30)
photo('lobby-1.jpg',40,245,210,380)
text(285,590,'700',50);text(285,557,'Единый отдел продаж',12,gray)
text(285,510,'Офис в Астане',17)
for i,line in enumerate(['ул. Сарайшык, 34А','БЦ Dara Residence','Встречу подтвердите по телефону.']):text(285,480-i*23,line,10,gray)
text(285,375,'info@sensata.kz',13)
text(40,205,'Источник материалов',14)
text(40,177,'sensata.kz/ru/project/shattyq',11)
c.linkURL('https://sensata.kz/ru/project/shattyq',(40,170,360,191),relative=0)
for i,line in enumerate(['Презентация подготовлена для этого сайта, не является официальным буклетом','или договорным документом застройщика. Комплектация, цены и условия покупки','подтверждаются менеджером. Демонстрационные 3D-модели в буклет не включены.']):text(40,139-i*20,line,9,gray)
footer(4);c.save();print(out)
