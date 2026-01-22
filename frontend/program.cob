IDENTIFICATION DIVISION.
PROGRAM-ID. CALC.

DATA DIVISION.
WORKING-STORAGE SECTION.
01 A      PIC 9(3).
01 B      PIC 9(3).
01 CH     PIC X.
01 RES    PIC 9(4).

PROCEDURE DIVISION.
    DISPLAY "Enter first number: ".
    ACCEPT A.
    DISPLAY "Enter second number: ".
    ACCEPT B.
    DISPLAY "Enter operation (+ or -): ".
    ACCEPT CH.

    IF CH = "+"
        COMPUTE RES = A + B
    ELSE
        COMPUTE RES = A - B
    END-IF.

    DISPLAY "Result: " RES.
    STOP RUN.

