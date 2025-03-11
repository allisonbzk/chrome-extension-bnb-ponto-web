var batidas = null;

function getDateTime() {
  let dateTime = null;
  $.ajaxSetup({ async: false });
  $.get("/Pontoweb/Home/getTime", function (data, status) {
    dateTime = (status == "success") ? data.split(" ")[1] : null;
  });
  return dateTime;
}

function atualizarRelogio() {
  $("#bnb-ponto-web-relogio").text(getDateTime());

  console.log("Atualizando relógio");
  setTimeout("atualizarRelogio()", 60 * 1000);
}

function convertMinutesToHour(minutes) {
  if (typeof minutes !== 'number' || minutes < 0) {
    return "Formato inválido";
  }

  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minutesLeft = (minutes % 60).toString().padStart(2, '0');

  return `${hours}:${minutesLeft}`;

}

function convertDateToMinute(dateTime) {
  if (!(dateTime instanceof Date))
    return "Formato inválido";

  return parseInt(dateTime.getHours() * 60) + parseInt(dateTime.getMinutes());
}

function convertTimeToMinute(time) {
  const partes = time.split(':');

  if (partes.length !== 3) {
    return "Formato inválido";
  }

  const horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1], 10);

  if (isNaN(horas) || isNaN(minutos)) {
    return "Formato inválido";
  }

  return horas * 60 + minutos;


}

class Batidas {
  constructor() {
    this.obterCargaHoraria();
    this.atualizarBatidas();
  }
  get batidas() {
    return this._batidas;
  }
  get batida1() {
    if (this._batida1 == null)
      this._batida1 = convertDateToMinute(this.batidas[0]);
    return this._batida1;
  }
  get batida2() {
    if (this._batida2 == null)
      this._batida2 = convertDateToMinute(this.batidas[1]);
    return this._batida2;
  }
  get batida3() {
    if (this._batida3 == null)
      this._batida3 = convertDateToMinute(this.batidas[2]);
    return this._batida3;
  }
  get batida4() {
    if (this._batida4 == null)
      this._batida4 = convertDateToMinute(this.batidas[3]);
    return this._batida4;
  }
  get saidaEstimada() {
    return this._saidaEstimada;
  }
  get quantidade() {
    if (this._quantidade == null)
      this._quantidade = this.batidas.length;
    return this._quantidade;
  }
  get cargaHoraria() {
    return this._cargaHoraria;
  }
  atualizarBatidas() {
    console.log("Atualizando batidas");

    this._batidas = null;
    this._quantidade = null;
    this.obterBatidas();
    this.obterSaidaEstimada();
    this.mostrarDuracaoIntervalo();
    this.mostrarPrevisaoRetorno();
    this.mostrarSaidaEstimada();
    this.mostrarHoraExtra();
  }
  atualizarHoraExtra() {
    console.log("Atualizando horas extra / à compensar");

    this.mostrarHoraExtra();
  }
  obterBatidas() {
    if (this._batidas == null) {
      var b = [];
      $.ajaxSetup({ async: false });
      $.get("/Pontoweb/api/batidas", function (data, status) { data.map(batida => b.push(new Date(batida.datahora + "-03:00"))); });
    }
    this._batidas = b;
  }
  obterCargaHoraria() {
    if (this._cargaHoraria == null) {
      var cargaHoraria;
      $.ajaxSetup({ async: false });
      $.get("/Pontoweb/Home/obterProximaBatida", function (data, status) {
        let cargaHorariaFuncionario = $(data).filter("#CargaHorariaFuncionario").val();
        cargaHoraria = parseInt(cargaHorariaFuncionario) * 60;
      });
    }
    this._cargaHoraria = cargaHoraria;
  }
  obterSaidaEstimada() {
    if (this.quantidade < 3)
      this._saidaEstimada = this.batida1 + this.cargaHoraria - (this.cargaHoraria == 360 ? 0 : -30);
    else
      this._saidaEstimada = this.batida1 + this.cargaHoraria + this.batida3 - this.batida2 - (this.cargaHoraria == 360 ? 15 : 0);
  }
  mostrarSaidaEstimada() {
    $("#bnb-ponto-web-info-saida-estimada").remove();

    if (this.quantidade > 0)
      $("#bnb-ponto-web-info").append('<span id="bnb-ponto-web-info-saida-estimada" class="label" title="' + (this.quantidade < 3 ? ((this.cargaHoraria == 360) ? "Considerando 15 min de intervalo" : "Considerando 30 min de intervalo") : "") + '">Saída estimada: <strong>' + convertMinutesToHour(this.saidaEstimada) + '</strong></span>');
  }
  mostrarPrevisaoRetorno() {
    $("#bnb-ponto-web-info-previsao-retorno").remove();

    if (this.quantidade == 2)
      $("#bnb-ponto-web-info").append('<span id="bnb-ponto-web-info-previsao-retorno" class="label">Prev. Retorno Intervalo: <strong>' + convertMinutesToHour(this.batida2 + (this.cargaHoraria == 360 ? 15 : 30)) + '</strong></span>');
  }
  mostrarDuracaoIntervalo() {
    $("#bnb-ponto-web-info-duracao-intervalo").remove();

    if (this.quantidade > 2)
      $("#bnb-ponto-web-info").append('<span id="bnb-ponto-web-info-duracao-intervalo" class="label">Duração do Intervalo: <strong>' + convertMinutesToHour(this.batida3 - this.batida2) + '</strong></span>');
  }
  mostrarHoraExtra() {
    $("#bnb-ponto-web-info-hora-extra, #bnb-ponto-web-info-hora-extra-maxima").remove();

    if (this.quantidade >= 3) {
      let baseComparacao = this.batida4 instanceof Number ? this.batida4 : convertTimeToMinute(getDateTime());
      if (this.saidaEstimada < baseComparacao) {
        $("#bnb-ponto-web-info").append('<span id="bnb-ponto-web-info-hora-extra" class="label">Extra: <strong>' + convertMinutesToHour(baseComparacao - this.saidaEstimada) + '</strong></span>');
        $("#bnb-ponto-web-info").append('<span id="bnb-ponto-web-info-hora-extra-maxima" class="label">Limite de Saída: <strong>' + convertMinutesToHour(this.saidaEstimada + 120 + (this.cargaHoraria == 360 ? 10 : 0)) + '</strong></span>');
      } else if (this.saidaEstimada > baseComparacao)
        $("#bnb-ponto-web-info").append('<span id="bnb-ponto-web-info-hora-extra" class="label">Compensar: <strong>' + convertMinutesToHour(this.saidaEstimada - baseComparacao) + '</strong></span>');
    }
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  $(document).ready(function () {

    // Criando label das informações
    $("#bnb-ponto-web-relogio, #bnb-ponto-web-info").remove();
    $("body > div.container > div:nth-child(3) > h3").append('<span id="bnb-ponto-web-relogio" class="label label-primary" />');
    $("body > div.container > div:nth-child(3) > h3").append('<div id="bnb-ponto-web-info" style="margin-top: 10px; clear: both;" />');
    $("body > div.container > div:nth-child(3)").css("padding-bottom", "10px");
    atualizarRelogio();

    // Instanciando Batidas
    batidas = new Batidas();
    setInterval("batidas.atualizarHoraExtra()", 60 * 1000);

    // Melhorando a função para a versão 3 do manifesto da extensão do Chrome
    function adicionarTriggerNaTabela() {
      const tabelaBatidas = document.getElementById("batidas");

      // Verifica se a tabela de batidas está presente
      if (tabelaBatidas) {
        // Utiliza MutationObserver para detectar quando novos elementos forem inseridos na tabela
        const observer = new MutationObserver(function (mutationsList) {
          for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
              batidas.atualizarBatidas();
            }
          }
        });

        // Configura o MutationObserver para observar mudanças na tabela
        observer.observe(tabelaBatidas, { childList: true });
      }
    }

    // Chamando a função para adicionar o trigger na tabela
    adicionarTriggerNaTabela();

    $("#new-batida").click(function () { setTimeout("$('#CaptchaCode').focus()", 1000) });

  });
  sendResponse();
});
