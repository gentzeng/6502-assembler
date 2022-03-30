; Version vom 05.02.21
﻿﻿ 
; 1. Zeile (Page 2): links Score (röm. Notation), rechts Anz. Leben
; Ufo fliegt durch Zeile 3 (Page 2)
; Kolonne bounced mehrfach, bevor sie eine Zeile tiefer gesetzt wird

; To Do 26.2.:
; Hit-Prozedur & Scoring
; Aliens animieren
; Score-Anzeige 

; initialisieren der Spiel-Variablen (Register)

lda #$00                 ; $01: Shoot-Flag für aktiven Kanonenschuss ...
sta $01                  ; ... auf 0 setzen

lda #$08                 ; $02: Sichtbarkeitstimer für Projektil ...
sta $02                  ; ... auf Initialwert setzen

lda #$01                 ; $03: Bewegungsrichtung der Aliens
sta $03                  ; ... auf Initialwert setzen (0: nach links, 1: nach rechts)

lda #$00                 ; $04: Ufo-Flag für aktives Ufo ...
sta $04                  ; ... auf 0 setzen

lda #$02                 ; $05: Anzahl der zusätzlichen Leben ...
sta $05                  ; ... auf 2 setzen

lda #$01                 ; $06: Level ...
sta $06                  ; ... startet mit 1

lda #$00                 ; $07: aktueller Score
sta $07                  ; ... startet bei 0

lda #$00                 ; $08: High Score
sta $08                  ; ... startet bei 0

lda #$10                 ; $09: Stichbarkeitstimer für die Aliens
sta $09                  ; ... auf Initialwert setzen

lda #$cf                 ; $10: Startadresse Kanone ...
sta $10                  ; ... auf Page 5 (Bildmitte)

lda #$af
sta $11                  ; Startadresse Projektil (Bildmitte)
lda #$05                 ; $11: Position $af auf der Page 
sta $12                  ; $12: Page-Nummer 5

lda #$41                 ; Startadresse Ufo
sta $13                  ; $13: auf Page 2

lda #$30                 ; $14: Sichtbarkeitstimer des Ufos
sta $14                  ; 30 Cyclen
sta $15                  ; Backup

lda #$02                 ; Highbyte (Page) für Alientest
sta $16                  
lda #$80                 ; Lowbyte (Pixel auf der Page) für Alientest ab 5. Zeile
sta $17

lda $fe                  ; Zufallswert für Ufo-Timer
sta $20                  ; Lowbyte [00 ... ff]
sta $22                  ; Backup Lowbyte
lda $fe                  ; Zufallswert für Ufo-Timer
and #$1f
sta $21                  ; Highbyte [00 ... 1f]

init_screen:             ;;; Aliens und Bunker zeichnen
   ldx #$06              ; Aliens zeichnen / Start-Spalte
   init_loop1:
      lda #$d            ; Hellgrün
      sta $02a0,x        ; ... zeichnen
      lda #$3            ; Cyan
      sta $02e0,x        ; ... zeichnen
      sta $0320,x        ; ... zeichnen
      lda #$4            ; Violett
      sta $0360,x        ; ... zeichnen
      sta $03a0,x
      inx                ; 1 Pixel Zwischenraum
      inx
      cpx #$1a
   bne init_loop1
   ldx #$00              ; oberen Teil vom Bunker zeichnen / Schleifenzähler
   lda #$05              ; Grün
   init_loop2:
      sta $0506,x
      sta $050c,x
      sta $0512,x
      sta $0518,x
      inx
      cpx #$2            ; 2 Pixel breit
   bne init_loop2
   ldx #$00              ; unteren Teil vom Bunker zeichnen / Schleifenzähler
   lda #$05              ; Grün
   init_loop3:
      sta $0525,x
      sta $052b,x
      sta $0531,x
      sta $0537,x
      inx
      cpx #$4            ; 4 Pixel breit
   bne init_loop3

main:
   jsr show_score        ; Score-Azeigen aktualisieren
   jsr alien_move        ; Testen: Noch Aliens auf dem Bildschirm?/Weiteranimieren
   jsr draw_canon
   jsr ufo               ; Testen: Noch Ufo auf dem Bildschirn?/Weiteranimieren
   ldx $ff               ; Tastaturbuffer abfragen
   cpx #$41              ; Taste A
   beq a                 ; oder
   cpx #$61              ; Taste a
   beq a                 ; dann nach links
   cpx #$44              ; Taste D
   beq d                 ; oder
   cpx #$64              ; Taste d
   beq d                 ; dann nach rechts
   cpx #$4d              ; Taste M
   beq m                 ; dann Schuss
   cpx #$6d              ; Taste m
   beq m                 ; dann Schuss
   jmp shoot             ; Testen: Schuss auf dem Bildschirm?/Weiteranimieren
jmp main  

; Sprungroutinen
a: jmp to_left
d: jmp to_right
m: 
   lda $01               ; Schuss-Flag prüfen:
   cmp #$01              ; bereits ein Schuss auf dem Bildschirm? ...
   beq no_shoot          ; ... dann zurück zu main
   lda #$01              ; sonst: Shoot-Flag ...
   sta $01               ; ... setzen und ...
   lda $10               ; ... Projektil ...
   sec                   ; ... eine Zeile über ...
   sbc #$20              ; ... der Kanone ...
   sta $11               ; ... platzieren 
   jmp shoot             ; und gleich zur Schuss-Routine springen
   no_shoot:
jmp main

shoot:                   ;;;
   lda $01               ; Schuss-Flag nicht gesetzt? ...
   beq shoot_exit1       ; ... Dann wieder raus

   ldy #$0               ; Fake-Vektor
   lda ($11),y           ; Projektil-Position laden
   and #$0e              ; AND 0000 1110: andere Farbe als 0 oder 1?
   bne hit_routine       ; kein Alien getroffen? Raus

   lda #$01              ; Weißes Projektil laden
   ldy #$0               ; Fake-Vektor
   sta ($11),y           ; Projektil-Position darstellen
   dec $02               ; Sichbarkeitstimer für Schuss dekrementieren
   bne shoot_exit1       ; noch nicht 0? Dann raus

   ldy #$0               ; Fake-Vektor
   lda #$00              ; Projektil löschen
   sta ($11),y           ; Projektil-Position laden 
   lda $11               ; Lade Zeilenpointer
   sec                   ; Carry setzen
   sbc #$20              ; setze Zeilen-Pointer eine Zeile höher
   bcc page_dec          ; falls schon an der Page-Oberkante: nächste Page
   sta $11               ; sonst: setze neuen Zeilen-Pointer
   jmp shoot_exit2       ; raus aus der Schuss-Routine
   page_dec:             ; nächste Page
      lda $11            ; Pointer auf der nächten Page ...
      clc 
      adc #$e0           ; ... aber in unterster Zeile! ...
      sta $11            ; ... restaurieren (über der Kanonenspitze)
      dec $12            ; Page-Pointer eine Page höher setzen
      lda $12            ; Page ...
      cmp #$01           ; ... noch nicht ganz oben? ...
      bne shoot_exit2    ; ... dann Ende
      jsr reload         ; Projektil wieder nach unten
   shoot_exit2:
   lda #$8               ; Sichbarkeitstimer-Timer ...
   sta $02               ; ... restaurieren
   shoot_exit1:
   jsr del_buff
jmp main
   
hit_routine:             ;;; Trefferauswertung, Explosion und Test auf vorhandene Aliens
   ldy #$0               ; Fake-Vektor
   lda ($11),y           ; Projektil-Position laden
   cmp #$0a              ; a = rot: Raumschiff
   bne gruen             ; nicht rot, dann grün?
   jsr reset_ufo         ; Werte für Ufo zurücksetzen
   jmp explosion 

   gruen:
   cmp #$0d              ; a = Hellgrün: Ufo 1. Reihe
   bne cyan              ; nicht grün, dann cyan?

   cyan:
   cmp #$03              ; a = Cyan: Ufo 2. oder 3. Reihe
   bne violett           ; nicht cyan, dann violett.

   violett:
   cmp #$04              ; a = Violett: Ufo 4. oder 5. Reihe

   ldx #$ff              ; Explosion an Trefferstelle
   ldy #$0
   explosion:
      lda #$1
      sta ($11),y
      lda #$0
      sta ($11),y
      dex
   bne explosion
                         ; Prüfen, ob noch Aliens vorhanden sind
   ldx #$ff              ; Zähler für Adressen innerhalb von ...
   search_frame2:        
       lda $0200,x       ; ... Page 2
       bne alien_exit    ; nicht Schwarz?
       dex
       cpx #$40          ; schon in Zeile 3?
       bne search_frame2
   ldx #$ff              ; Zähler für Adressen innerhalb von ...
   search_frame3to5:
       lda $0300,x       ; ... Page 3
       bne alien_exit    ; nicht Schwarz?
       lda $0400,x       ; ... Page 4
       bne alien_exit    ; nicht Schwarz?
       lda $0500,x       ; ... Page 5
       cmp #$05          ; Kanone oder Bunker?
       beq base          ; dann weitersuchen
       cmp #$0           ; Schwarz?
       bne alien_exit 
       base:             ;
       dex               ; nächstes Pixel prüfen
   bne search_frame3to5
   jmp next_level        ; keine Aliens mehr auf den Schirm
   alien_exit:           ; noch Aliens auf dem Schirm
   lda #$0               ; Shoot-Flag ...
   sta $01               ; ... auf 0
   jsr reload            ; Kanone laden
   jsr del_buff
jmp main

next_level:              ;;;
    inc $06              ; Ein Level weiter
    lda #$0              ; Shoot-Flag ...
    sta $01              ; ... auf 0
    jsr reload           ; Kanone laden
    jsr del_buff
jmp init_screen          ; Bildschirm neu aufbauen

reload:                  ; Schuss wieder zurück auf die Kanone setzen
   lda #$05              ; Projektil wieder ...
   sta $12               ; ... auf Page 5 ...
   lda $10               ; ... und  ...
   sec                   ; ... eine Zeile über ...
   sbc #$20              ; ... der Kanone ...
   sta $11               ; ... platzieren
   lda #$0               ; Shoot-Flag ...
   sta $01               ; ... auf 0 setzen
rts

to_left:
    jsr erase_canon
    dec $10              ; Ändern Startadresse der Kanonenspitze
    jsr border_test
    jsr draw_canon
    jsr del_buff
jmp main

to_right:
    jsr erase_canon
    inc $10              ; Ändern Startadresse der Kanonenspitze
    jsr border_test
    jsr draw_canon
    jsr del_buff
jmp main

ufo:
   lda $04               ; Ufo-Flag ...
   cmp #$01              ; ... gesetzt? ...
   beq anim_ufo          ; ... Dann weiter animieren
   dec $20               ; sonst: Ufo-Timer Lowbyte dekrementieren
   bne exit_ufo          ; noch nicht 0? Dann raus
   lda $22               ; mit Backup Ufo-Timer Lowbyte ...
   sta $20               ; ... restaurieren
   dec $21               ; Ufo-Timer Highbyte dekrementieren
   bne exit_ufo          ; noch nicht 0? Dann raus
   lda #$01              ; andernfalls: Ufo-Flag ...
   sta $04               ; ... setzen

anim_ufo:                ;;;
   lda #$0a              ; Rot laden ...
   ldx $13               ; Ufo-Position laden ...
   sta $0200,x           ; ... auf den Bildschirm
 
   dec $14               ; Sichtbarkeitstimer dekrementieren
   bne exit_ufo          ; Noch nicht 0? Dann raus
   lda #$0               ; Schwarz laden
   sta $0200,x           ; ... und Ufo an alter Position löschen
   lda $15               ; Backup Sichtbarkeitstimer laden ...
   sta $14               ; ... und Sichtbarkeitstimer restaurieren
   inc $13               ; Ufo-Position 1 nach rechts
   lda $13               ; Ufoposition ...
   cmp #$5f              ; ... noch nicht am rechten Bildrand? ...
   bne exit_ufo          ; ... Dann raus
   reset_ufo:
   lda $fe               ; restauriere Zufallstimer für Ufo ...
   sta $20               ; ... Lowbyte
   sta $22               ; ... Backup Lowbyte
   lda $fe               ; restauriere Zufallstimer für Ufo ...
   and #$1f
   sta $21               ; ... Highbyte
   lda #$41              ; Ufo-Position wieder ...
   sta $13               ; ... an den linken Bildrand
   lda #$00              ; Ufo-Flag ...
   sta $04               ; ... wieder löschen
   exit_ufo:
rts

show_score:              ;;;
; 1. Leben
ldx $05                  ; Anzahl der verbliebenen Leben laden
score_loop1:             ; 
   lda #$05              ; in Grün ...
   sta $0200,x           ; ... Links oben darstellen
   dex
   bne score_loop1

; 2. Score
; ... TO DO!

; 3. Level 
lda #$1f                 ; Lade Bildschirmposition (rechter Rand, 1 Zeile)
sec 
sbc $06                  ; Subtrahiere Anzahl des aktuellen Levels
tax
score_loop3:
   lda #$07              ; in Gelb ...
   sta $0200,x           ; ... Rechts oben darstellen
   inx
   cpx #$1f
   bne score_loop3
rts

alien_move:
   dec $9                ; Sichbarkeitscounter dekrementieren
   bne exit_alien_move   ; Noch nicht 0? Dann raus.
   lda $3                ; Richtungsvektor laden
   beq alien_left        ; wenn 0, dann nach links
                         ; Routine für Bewegung nach Rechts:
   ldy #$0               ; Fake-Vektor
   alien_right:
      lda ($16),y        ; Teste $0280-$05ff
      beq exit_alien_move; Schwarz? Dann raus
      cmp #$5            ; DunkelGrün? ...
      beq exit_alien_move; ... Dann raus
      

      inc $17            ; Nächstes Pixel
      lda $17            ; Page zuende?
      bne alien_right    ; Nein: dann weiter
      lda #$0            ; Reset ...
      sta $17            ; ... Lowbyte
      inc $16            ; nächste Page
      lda $16            ; Letzte page ...
      cmp #$6            ; ... noch nicht überschritten?
      bne alien_right    ; dann weiter
      lda #$02           ; Reset ...
      sta $16            ; ... Highbyte

      cpy #$ff           ; noch nicht alle Pixel untersucht?
      bne alien_right    ; dann zurück
      inc $17
      lda $17
      cmp #$06           ; noch nicht letzte Page?
      bne alien_right    ; dann zurück
   jmp exit_alien_move   ; Raus
   alien_move_right:
      


   alien_left:
   


   exit_alien_move:
rts


; Subroutinen

border_test:
    ldx $10              ; lade aktuelle Pixelposition
    cpx #$c0             ; linker Rand erreicht? ...
    beq left_border      ; ... dann zurücksetzen
    cpx #$df             ; rechter Rand erreicht? ...
    beq right_border     ; ... dann zurücksetzen
    exit_test:
rts  

left_border:             ; auf linken Rand zurücksetzen
    lda #$c1
    sta $10
jmp exit_test

right_border:            ; auf rechten Rand zurücksetzen
    lda #$de
    sta $10
jmp exit_test 

erase_canon:
    ldx $10              ; Referenzpunkt laden
    lda #$0              ; Schwarz
    sta $0500,x          ; Kanone ...
    clc
    txa                  ;
    adc #$20             ; eine Zeile darunter
    tax                  ;
    lda #$0              ; Schwarz
    dex                  ; Position linkes Pixel
    sta $0500,x
    inx                  ; Position mittleres Pixel
    sta $0500,x
    inx                  ; Position rechtes Pixel
    sta $0500,x
rts

draw_canon:
    ldx $10              ; Referenzpunkt laden
    lda #$5              ; grün
    sta $0500,x          ; Kanone ...
    clc
    txa                  ;
    adc #$20             ; eine Zeile darunter
    tax                  ;
    lda #$5              ;
    dex                  ; Position linkes Pixel
    sta $0500,x
    inx                  ; Position mittleres Pixel
    sta $0500,x
    inx                  ; Position rechtes Pixel
    sta $0500,x
rts

del_buff:
    ldx #$0              ; Tastaturpuffer ...
    stx $ff              ; ... löschen
rts
