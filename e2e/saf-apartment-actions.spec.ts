import {expect,test} from '@playwright/test';
const unit='/saf/apartment/saf-observation-1-2-property-1';

test('apartment favorites persist and the consultation form sends only the existing local lead payload',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  let submitted:Record<string,unknown>|null=null;
  await page.route('**/api/leads',async route=>{submitted=route.request().postDataJSON();await route.fulfill({json:{ok:true,message:'Заявка сохранена локально. Это не подтверждённая бронь.'}});});
  await page.goto(unit);
  await page.getByRole('button',{name:'Сохранить квартиру в избранное'}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Убрать квартиру из избранного'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Обсудить бронирование'}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('не резервируется автоматически');
  await dialog.getByLabel('Ваше имя').fill('Тестовая заявка');
  await dialog.getByLabel('Телефон',{exact:true}).fill('+70000000001');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button',{name:'Оставить заявку'}).click();
  await expect(dialog.getByRole('status')).toContainText('сохранена локально');
  expect(submitted).toMatchObject({name:'Тестовая заявка',phone:'+70000000001',consent:true,website:''});
  expect(submitted!['topic']).toContain('квартира № 1, секция 1, этаж 2');
  expect(Object.keys(submitted!).sort()).toEqual(['consent','name','phone','requestId','topic','website']);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('payment arithmetic, related apartments and print card preserve apartment facts',async({page})=>{
  await page.goto(unit);
  await page.getByLabel('Стоимость квартиры, ₸',{exact:true}).fill('12000000');
  await page.getByLabel('Первый взнос, ₸',{exact:true}).fill('2000000');
  await page.getByLabel('Ставка, % годовых',{exact:true}).fill('0');
  await page.getByLabel('Срок, лет',{exact:true}).fill('10');
  await expect(page.locator('output')).toContainText('83 333');
  await page.getByLabel('Первый взнос, ₸',{exact:true}).fill('20000000');
  await expect(page.locator('output')).toContainText('Заполните параметры');
  await page.getByRole('tab',{name:'Оплата 100%',exact:true}).click();
  await expect(page.locator('.saf-purchase-options')).toContainText('уточнит отдел продаж');
  await page.emulateMedia({media:'print'});
  await expect(page.locator('.saf-apartment-print')).toBeVisible();
  await expect(page.locator('.saf-apartment-summary')).toBeHidden();
  await expect(page.locator('.saf-apartment-print')).toContainText('80.58');
  await page.emulateMedia({media:'screen'});
  const related=page.locator('.saf-related-apartments a').first();
  const href=await related.getAttribute('href');
  await related.click();
  await expect(page).toHaveURL(new RegExp(href!+'$'));
  await expect(page.locator('h1')).toContainText('2-комнатная');
});

test('favorites collect apartments and compare two or more with real parameters and history',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  for(let number=1;number<=4;number++){
    await page.goto(`/saf/apartment/saf-observation-1-2-property-${number}?tab=plan`);
    await page.getByRole('button',{name:'Сохранить квартиру в избранное',exact:true}).click();
    if(number<=2)await page.getByRole('button',{name:'Сравнить',exact:true}).click();
  }
  await page.getByRole('link',{name:'Моё избранное',exact:true}).click();
  await expect(page).toHaveURL(/\/saf\/favorites$/);
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(4);
  await page.getByRole('link',{name:'Смотреть сравнение (2)',exact:true}).click();
  const table=page.getByRole('table');
  await expect(table.locator('thead th')).toHaveCount(3);
  await expect(table.getByRole('row',{name:/Площадь/})).toContainText('80,58 м²');
  await expect(table.getByRole('row',{name:/Площадь/})).toContainText('118,87 м²');
  await expect(table.getByRole('row',{name:/Цена сейчас/})).toContainText('Уточняется');
  await page.getByLabel('Только различия').check();
  await expect(table.getByRole('row',{name:/^Секция/})).toHaveCount(0);
  await expect(table.getByRole('row',{name:/Площадь/})).toBeVisible();
  await page.getByLabel('Только различия').uncheck();
  await page.goBack();
  await expect(page).toHaveURL(/\/saf\/favorites$/);
  await page.getByRole('button',{name:'Сравнить',exact:true}).first().click();
  await page.getByRole('button',{name:'Сравнить',exact:true}).first().click();
  await page.getByRole('link',{name:'Смотреть сравнение (4)',exact:true}).click();
  await page.reload();
  await expect(table.locator('thead th')).toHaveCount(5);
  const scroll=page.getByRole('region',{name:'Сравнение: Квартиры',exact:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  if((page.viewportSize()?.width||0)<1000){
    await scroll.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(()=>scroll.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
  }
  await table.getByRole('button',{name:'Убрать 2-комнатная № 4 из сравнения',exact:true}).click();
  await expect(table.locator('thead th')).toHaveCount(4);
  await page.getByRole('link',{name:'Открыть избранное',exact:true}).click();
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(4);
  await page.getByRole('button',{name:'Убрать 2-комнатная № 1 из избранного',exact:true}).click();
  await page.reload();
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(3);
  await page.getByRole('button',{name:'Квартиры',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#saf-nav-apartments').getByRole('link',{name:'Избранное (3)',exact:true})).toBeVisible();
  await page.locator('#saf-nav-apartments').getByRole('link',{name:'Сравнение (3)',exact:true}).click();
  await table.locator('a').filter({hasText:'2-комнатная № 1'}).click();
  await expect(page.getByRole('button',{name:'Сохранить квартиру в избранное',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button',{name:'Убрать из сравнения',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(errors).toEqual([]);
});

test('missing plans, old saved keys and corrupted selection remain usable',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('saf-favorite-apartments',JSON.stringify(['saf-observation-1-4-property-14','saf-observation-1-4-property-14','missing',17]));
    localStorage.setItem('sensata-saf-saved-plans',JSON.stringify(['KV-P7-E3-S1']));
    localStorage.setItem('saf-compare-apartments','broken json');
    localStorage.setItem('sensata-saf-compare-plans','{}');
  });
  await page.goto('/saf/favorites');
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(2);
  await expect(page.getByText('План не опубликован',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Планировки из каталога 1',exact:true})).toBeVisible();
  await page.getByRole('region',{name:'Квартиры',exact:true}).getByRole('button',{name:'Сравнить',exact:true}).click();
  await page.getByRole('link',{name:'Смотреть сравнение (1)',exact:true}).click();
  await expect(page.getByText('Добавьте ещё один вариант этой категории для сравнения.',{exact:true})).toBeVisible();
  await expect(page.getByText('План не опубликован',{exact:true})).toBeVisible();
  await page.locator('.saf-shortlist-remove').click();
  await expect(page.getByRole('heading',{name:'Пока нечего сравнивать',exact:true})).toBeVisible();
});
