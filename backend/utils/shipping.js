export function computeShipping({mode='flat', flat=0, base=0, perKg=0, weightTotal=0}){
  let amount=0, label='';
  if (mode==='weight') {
    amount = Number(base||0) + Number(perKg||0)*Number(weightTotal||0);
    label = `Poids (${weightTotal} kg)`;
  } else {
    amount = Number(flat||0);
    label = 'Forfait';
  }
  return { amount:+(+amount).toFixed(2), label };
}
