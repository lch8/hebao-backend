import {DatabaseSync} from 'node:sqlite';

// Exercise the real SQL without network access or production credentials.
export function mockTurso() {
  const db=new DatabaseSync(':memory:');
  const originalFetch=globalThis.fetch;
  const fromValue=value=>value.type==='null'?null:['integer','float'].includes(value.type)?Number(value.value):String(value.value);
  const toValue=value=>value==null?{type:'null'}:typeof value==='number'?{type:Number.isInteger(value)?'integer':'float',value:String(value)}:{type:'text',value:String(value)};
  let beforeExecute;
  globalThis.fetch=async(url,init)=>{
    if(!String(url).endsWith('/v2/pipeline'))throw new Error('Unexpected external request in test');
    const {sql,args=[]}=JSON.parse(init.body).requests[0].stmt;
    const values=args.map(fromValue);
    if(beforeExecute)beforeExecute(sql,values);
    try {
      const statement=db.prepare(sql);
      let rows=[],columns=[],affected=0;
      if(/\bRETURNING\b|^\s*SELECT\b/i.test(sql)){
        rows=statement.all(...values);columns=statement.columns().map(column=>column.name);affected=rows.length;
      } else affected=Number(statement.run(...values).changes);
      return Response.json({results:[{type:'ok',response:{result:{cols:columns.map(name=>({name})),rows:rows.map(row=>columns.map(column=>toValue(row[column]))),affected_row_count:affected}}}]});
    }catch(error){return Response.json({results:[{type:'error',error:{message:error.message}}]});}
  };
  return {db,intercept:callback=>{beforeExecute=callback;},restore:()=>{globalThis.fetch=originalFetch;db.close();}};
}
