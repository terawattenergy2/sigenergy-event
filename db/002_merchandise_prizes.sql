INSERT INTO prize_types(id,label,discount,cap,quantity,display_order) VALUES
 ('hat','หมวก TE',0,3000,10,4),
 ('shirt','เสื้อ TE',0,2500,5,5),
 ('micro','Sigen Micro',0,12400,2,6)
 ON CONFLICT(id) DO UPDATE SET label=excluded.label,discount=excluded.discount,cap=excluded.cap,quantity=excluded.quantity,display_order=excluded.display_order;
