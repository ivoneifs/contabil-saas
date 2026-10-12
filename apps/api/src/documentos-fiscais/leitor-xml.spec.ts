import { chaveNoPdf, chaveValida, lerXmlFiscal, modeloPelaChave } from './leitor-xml';

// Monta uma chave de 44 dígitos com DV correto para o modelo pedido.
function chave(modelo: string, numero = '000001234') {
  const base = `29261012345678000195${modelo}001${numero}1${'12345678'}`;
  let soma = 0;
  let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += Number(base[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const r = soma % 11;
  return base + (r < 2 ? 0 : 11 - r);
}

const xml = (s: string) => Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>${s}`);

describe('lerXmlFiscal', () => {
  const ch55 = chave('55');

  it('lê NF-e autorizada (nfeProc)', () => {
    const d = lerXmlFiscal(
      xml(`<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe${ch55}" versao="4.00">
        <ide><mod>55</mod><serie>1</serie><nNF>1234</nNF><natOp>VENDA</natOp><dhEmi>2026-09-10T10:00:00-03:00</dhEmi></ide>
        <emit><CNPJ>12345678000195</CNPJ><xNome>Padaria Sol</xNome></emit>
        <dest><CNPJ>00011122000133</CNPJ><xNome>Mercado Lua</xNome></dest>
        <total><ICMSTot><vNF>1500.50</vNF></ICMSTot></total></infNFe></NFe>
        <protNFe><infProt><chNFe>${ch55}</chNFe><nProt>129260000000001</nProt><cStat>100</cStat></infProt></protNFe></nfeProc>`),
    );
    expect(d).toMatchObject({
      modelo: 'NFE',
      chaveAcesso: ch55,
      numero: '1234',
      serie: '1',
      emitenteDoc: '12345678000195',
      destinatarioDoc: '00011122000133',
      valorTotal: 1500.5,
      situacao: 'AUTORIZADA',
      protocolo: '129260000000001',
    });
  });

  it('reconhece NFC-e pelo modelo 65 e mantém zeros à esquerda do CPF', () => {
    const ch65 = chave('65');
    const d = lerXmlFiscal(
      xml(`<nfeProc><NFe><infNFe Id="NFe${ch65}"><ide><mod>65</mod><nNF>9</nNF><dhEmi>2026-09-10T10:00:00-03:00</dhEmi></ide>
        <emit><CNPJ>12345678000195</CNPJ></emit><dest><CPF>01234567890</CPF></dest><total><ICMSTot><vNF>25.00</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`),
    );
    expect(d.modelo).toBe('NFCE');
    expect(d.destinatarioDoc).toBe('01234567890');
    expect(d.situacao).toBe('SEM_PROTOCOLO');
  });

  it('lê CT-e', () => {
    const ch57 = chave('57');
    const d = lerXmlFiscal(
      xml(`<cteProc><CTe><infCte Id="CTe${ch57}"><ide><mod>57</mod><nCT>77</nCT><serie>2</serie><natOp>FRETE</natOp><dhEmi>2026-09-11T08:00:00-03:00</dhEmi></ide>
        <emit><CNPJ>12345678000195</CNPJ><xNome>Transportes X</xNome></emit><dest><CNPJ>00011122000133</CNPJ></dest>
        <vPrest><vTPrest>890.00</vTPrest></vPrest></infCte></CTe><protCTe><infProt><cStat>100</cStat><nProt>1</nProt></infProt></protCTe></cteProc>`),
    );
    expect(d).toMatchObject({ modelo: 'CTE', chaveAcesso: ch57, numero: '77', valorTotal: 890, situacao: 'AUTORIZADA' });
  });

  it('lê MDF-e', () => {
    const ch58 = chave('58');
    const d = lerXmlFiscal(
      xml(`<mdfeProc><MDFe><infMDFe Id="MDFe${ch58}"><ide><nMDF>5</nMDF><serie>1</serie><UFIni>BA</UFIni><UFFim>SP</UFFim><dhEmi>2026-09-12T08:00:00-03:00</dhEmi></ide>
        <emit><CNPJ>12345678000195</CNPJ></emit><tot><vCarga>45000.00</vCarga></tot></infMDFe></MDFe></mdfeProc>`),
    );
    expect(d).toMatchObject({ modelo: 'MDFE', numero: '5', valorTotal: 45000, naturezaOperacao: 'BA → SP' });
  });

  it('lê evento de cancelamento homologado', () => {
    const d = lerXmlFiscal(
      xml(`<procEventoNFe><evento><infEvento Id="ID110111${ch55}01"><CNPJ>12345678000195</CNPJ><chNFe>${ch55}</chNFe><dhEvento>2026-09-10T12:00:00-03:00</dhEvento>
        <tpEvento>110111</tpEvento><detEvento><descEvento>Cancelamento</descEvento><xJust>Erro de digitação no pedido</xJust></detEvento></infEvento></evento>
        <retEvento><infEvento><cStat>135</cStat><nProt>99</nProt></infEvento></retEvento></procEventoNFe>`),
    );
    expect(d).toMatchObject({ modelo: 'EVENTO', chaveAfetada: ch55, cancelamento: true, situacao: 'HOMOLOGADO' });
  });

  it('lê NFS-e do padrão nacional', () => {
    const d = lerXmlFiscal(
      xml(`<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse"><infNFSe Id="NFS29271010012345678000195000000000000126091234567890"><nNFSe>12</nNFSe><dhProc>2026-09-15T09:00:00-03:00</dhProc>
        <emit><CNPJ>12345678000195</CNPJ><xNome>Consultoria Y</xNome></emit><valores><vLiq>2000.00</vLiq></valores>
        <DPS><infDPS><serie>900</serie><toma><CNPJ>00011122000133</CNPJ><xNome>Cliente Z</xNome></toma></infDPS></DPS></infNFSe></NFSe>`),
    );
    expect(d).toMatchObject({ modelo: 'NFSE', numero: '12', valorTotal: 2000, destinatarioNome: 'Cliente Z' });
  });

  it('lê NFS-e municipal ABRASF', () => {
    const d = lerXmlFiscal(
      xml(`<CompNfse><Nfse><InfNfse><Numero>345</Numero><CodigoVerificacao>ABC123</CodigoVerificacao><DataEmissao>2026-09-20T10:00:00</DataEmissao>
        <Servico><Valores><ValorServicos>750.00</ValorServicos></Valores><Discriminacao>Honorários contábeis</Discriminacao></Servico>
        <PrestadorServico><IdentificacaoPrestador><CpfCnpj><Cnpj>12345678000195</Cnpj></CpfCnpj></IdentificacaoPrestador><RazaoSocial>Escritório A</RazaoSocial></PrestadorServico>
        <TomadorServico><IdentificacaoTomador><CpfCnpj><Cnpj>00011122000133</Cnpj></CpfCnpj></IdentificacaoTomador><RazaoSocial>Empresa B</RazaoSocial></TomadorServico>
        </InfNfse></Nfse></CompNfse>`),
    );
    expect(d).toMatchObject({ modelo: 'NFSE', numero: '345', valorTotal: 750, emitenteDoc: '12345678000195', destinatarioDoc: '00011122000133' });
  });

  it('marca XML qualquer como desconhecido', () => {
    expect(lerXmlFiscal(xml('<pedido><id>1</id></pedido>')).modelo).toBe('DESCONHECIDO');
    expect(lerXmlFiscal(Buffer.from('isto não é xml <<<')).modelo).toBe('DESCONHECIDO');
  });
});

describe('chaves', () => {
  it('valida o dígito verificador', () => {
    const c = chave('55');
    expect(chaveValida(c)).toBe(true);
    expect(chaveValida(c.slice(0, 43) + ((Number(c[43]) + 1) % 10))).toBe(false);
  });

  it('descobre o modelo pela chave', () => {
    expect(modeloPelaChave(chave('57'))).toBe('CTE');
    expect(modeloPelaChave(null)).toBe('DESCONHECIDO');
  });

  it('acha a chave no nome do PDF ou no texto com espaços', () => {
    const c = chave('55');
    expect(chaveNoPdf(`DANFE-${c}.pdf`, Buffer.from('%PDF-1.4'))).toBe(c);
    const comEspacos = c.replace(/(\d{4})/g, '$1 ');
    expect(chaveNoPdf('danfe.pdf', Buffer.from(`%PDF-1.4 (CHAVE DE ACESSO) ${comEspacos}`))).toBe(c);
  });
});
