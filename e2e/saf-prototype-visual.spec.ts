import { expect, test } from '@playwright/test';

test('photo polygons lead through all seven facades to a highlighted numbered apartment', async ({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${new URL(r.url()).pathname}`);});
  const touch=!!test.info().project.use.hasTouch;
  for(const section of ['1','2','3','4','5','6','7']){
    await page.goto('/');
    const region=page.locator('.saf-building-region').filter({hasNotText:'unused'}).and(page.getByRole('button',{name:new RegExp(`^Секция ${section},`)}));
    if(touch)await region.tap();else{await region.hover();await expect(page.locator('.saf-building-info')).toContainText(`Секция ${section}`);await region.click();}
    await expect(page).toHaveURL(new RegExp(`/block/${section}$`));
    const floor=page.getByRole('button',{name:/^Этаж 2,/});
    await floor.focus();await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/block/${section}/floor/2$`));
    const apartment=page.locator('.saf-floor-apartment[role=button]').first();
    const label=await apartment.getAttribute('aria-label');
    const number=label!.match(/№ (\d+)/)![1];
    await apartment.focus();
    await expect(page.locator('.saf-floor-hover-card')).toContainText(`№ ${number}`);
    await page.keyboard.press('Enter');
    await expect(page.locator('h1')).toContainText(`№ ${number}`);
    await page.getByRole('tab',{name:'На этаже',exact:true}).click();
    await expect(page.locator('.saf-floor-apartment.is-selected')).toHaveAttribute('aria-label',new RegExp(`№ ${number},`));
    await page.reload();
    await expect(page.locator('.saf-floor-apartment.is-selected')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('complex panorama has real textures, three points, keyboard rotation and persistent deep links',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const loaded:string[]=[];
  page.on('response',r=>{if(/cam-5.*\.jpg/.test(r.url())&&r.status()===200)loaded.push(r.url());});
  await page.goto('/');
  await page.getByRole('button',{name:'3D-тур по комплексу',exact:true}).click();
  await expect(page).toHaveURL(/view=360/);
  const canvas=page.locator('.saf-complex-tour canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(()=>loaded.length).toBeGreaterThan(1);
  await canvas.focus();
  const before=await canvas.screenshot();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async()=>Buffer.compare(before,await canvas.screenshot())).not.toBe(0);
  await page.getByRole('tab',{name:'Со стороны двора',exact:true}).click();
  await expect(page.locator('.panorama-viewer-root')).toHaveAttribute('data-panorama-id','cam-6');
  await page.getByRole('tab',{name:'Высотная панорама',exact:true}).click();
  await expect(page).toHaveURL(/point=aerial/);
  await page.reload();
  await expect(page.locator('.panorama-viewer-root')).toHaveAttribute('data-panorama-id','aerial');
  await page.getByRole('button',{name:'Закрыть 360-тур'}).click();
  await expect(page.locator('.saf-building-scene')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.panorama-viewer-root')).toHaveAttribute('data-panorama-id','aerial');
  await page.getByRole('button',{name:'Закрыть 360-тур'}).click();
  await expect(page.locator('.saf-complex-tour canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('panorama texture failure remains recoverable by choosing another point',async({page})=>{
  await page.route('**/saf-tour/cam-6.jpg',route=>route.abort());
  await page.goto('/?view=360&point=cam-6');
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить панораму');
  await page.getByRole('tab',{name:'Общий вид',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('.panorama-viewer-root')).toHaveAttribute('data-panorama-id','cam-5');
});
