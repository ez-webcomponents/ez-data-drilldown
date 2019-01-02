#!/usr/bin/perl

open(IN,"./srch-data-70000.txt");
my $i = 1; 
@gender = ("Unknown", "Male", "Female");
@division = ("Support", "Development", "Marketing");
@company = ("Spillman", "Space Dynamics Lab", "Nucore");
@ages = (10, 16, 25, 29, 33, 44, 56, 73, 88, 99);
@dates = ("2018-01-01", "2018-01-11", "2018-02-01", "2018-02-11", "2018-05-01", "2018-05-22", "2018-08-01", "2018-08-11", "2018-10-01"
, "2018-11-01", "2018-11-11", "2018-11-22", "2019-01-01", "2019-01-11", "2019-03-01", "2019-03-21", "2019-05-01", "2019-05-21"
, "2019-07-01", "2019-07-11", "2019-10-01", "2019-10-11", "2019-11-01", "2019-11-11", "2020-01-01", "2020-01-11", "2020-03-01");
while (<IN>) {

	if ($_ =~ /_id/i) {
		$randRevenue = int(rand(1000));
		$randDiv = int(rand(3));
		$randCompany = int(rand(3));
		$randDates = int(rand(25));
		
		print "    \"_id\": \"$i\",\n"; 
		print "    \"revenue\": \"$randRevenue\",\n"; 
		print "    \"division\": \"$division[$randDiv]\",\n";
		print "    \"company\": \"$company[$randCompany]\",\n";
		print "    \"startdate\": \"$dates[$randDates]\",\n";
		$i++;
	} elsif ($_ =~ /age/) { 
		$rand = int(rand(10));
		print "    \"age\": \"$ages[$rand]\",\n"; 
	} elsif ($_ =~ /gender/) { 
		$randGender = int(rand(3));
		print "    \"gender\": \"$gender[$randGender]\"\n"; 
	} else {
		print $_;
	}
}
